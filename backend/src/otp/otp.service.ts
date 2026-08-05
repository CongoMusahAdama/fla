import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';

type OtpChannel = 'phone' | 'email';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  /** In-memory fallback / cache; Mongo is source of truth so restarts don't kill codes. */
  private otpStore: Map<string, { code: string; expiresAt: Date; verified: boolean }> = new Map();

  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>) {}

  /** Ghana local format 0XXXXXXXXX */
  normalizePhone(phone: string): string {
    let cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('233') && cleaned.length >= 12) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    return cleaned.startsWith('0') && cleaned.length === 10 ? cleaned : '';
  }

  normalizeEmail(email: string): string {
    return (email || '').toLowerCase().trim();
  }

  /** Digits only — handles "1 2 3 4", accidental spaces, and number-typed JSON bodies. */
  normalizeCode(code: unknown): string {
    return String(code ?? '').replace(/\D/g, '');
  }

  private storageKey(channel: OtpChannel, value: string): string {
    if (channel === 'phone') {
      return `phone:${this.normalizePhone(value)}`;
    }
    return `email:${this.normalizeEmail(value)}`;
  }

  generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async storeOTP(channel: OtpChannel, value: string, code: string): Promise<void> {
    const key = this.storageKey(channel, value);
    if (channel === 'phone' && !key.replace('phone:', '')) {
      this.logger.warn(`storeOTP skipped: invalid phone key for channel=phone`);
      return;
    }
    if (channel === 'email' && key === 'email:') {
      this.logger.warn(`storeOTP skipped: empty email`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const normalizedCode = this.normalizeCode(code);

    this.otpStore.set(key, {
      code: normalizedCode,
      expiresAt,
      verified: false,
    });

    await this.otpModel
      .findOneAndUpdate(
        { key },
        { key, code: normalizedCode, expiresAt, verified: false },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    this.logger.log(`OTP stored for ${key} (expires ${expiresAt.toISOString()})`);
  }

  async verifyOTP(channel: OtpChannel, value: string, code: string): Promise<boolean> {
    const key = this.storageKey(channel, value);
    const inputCode = this.normalizeCode(code);

    if (!inputCode || !key || key.endsWith(':')) {
      this.logger.warn(`verifyOTP bail: empty code or key (${key})`);
      return false;
    }

    // Prefer Mongo (survives restarts); fall back to memory
    let otpData = await this.otpModel.findOne({ key }).lean().exec();
    if (!otpData) {
      const mem = this.otpStore.get(key);
      if (mem) {
        otpData = { key, ...mem } as any;
      }
    }

    if (!otpData) {
      this.logger.warn(`verifyOTP: no OTP found for ${key}`);
      return false;
    }

    if (otpData.verified) {
      this.logger.warn(`verifyOTP: already used for ${key}`);
      return false;
    }

    if (new Date() > new Date(otpData.expiresAt)) {
      this.logger.warn(`verifyOTP: expired for ${key}`);
      await this.deleteOTP(channel, value);
      return false;
    }

    if (this.normalizeCode(otpData.code) !== inputCode) {
      this.logger.warn(
        `verifyOTP: mismatch for ${key} (got len=${inputCode.length}, expected len=${String(otpData.code).length})`,
      );
      return false;
    }

    await this.otpModel.updateOne({ key }, { $set: { verified: true } }).exec();
    const mem = this.otpStore.get(key);
    if (mem) {
      mem.verified = true;
      this.otpStore.set(key, mem);
    }

    return true;
  }

  async deleteOTP(channel: OtpChannel, value: string): Promise<void> {
    const key = this.storageKey(channel, value);
    this.otpStore.delete(key);
    await this.otpModel.deleteOne({ key }).exec();
  }

  async isVerified(channel: OtpChannel, value: string): Promise<boolean> {
    const key = this.storageKey(channel, value);
    const doc = await this.otpModel.findOne({ key }).lean().exec();
    if (doc) return !!doc.verified;
    return this.otpStore.get(key)?.verified || false;
  }
}
