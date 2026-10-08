import { clicksForAmount, normalizeListingMode, WHATSAPP_CLICK_PRICE_GHS } from './whatsapp-clicks.util';

describe('clicksForAmount', () => {
  it('prices one click at 0.50', () => {
    expect(WHATSAPP_CLICK_PRICE_GHS).toBe(0.5);
    expect(clicksForAmount(0.5)).toEqual({ clicks: 1, chargeGhs: 0.5 });
    expect(clicksForAmount(1)).toEqual({ clicks: 2, chargeGhs: 1 });
    expect(clicksForAmount(10)).toEqual({ clicks: 20, chargeGhs: 10 });
  });

  it('drops a partial click and charges only whole clicks', () => {
    expect(clicksForAmount(1.2)).toEqual({ clicks: 2, chargeGhs: 1 });
    expect(clicksForAmount(0.49)).toEqual({ clicks: 0, chargeGhs: 0 });
  });

  it('treats empty amounts as zero clicks', () => {
    expect(clicksForAmount(0)).toEqual({ clicks: 0, chargeGhs: 0 });
    expect(clicksForAmount(Number.NaN)).toEqual({ clicks: 0, chargeGhs: 0 });
  });
});

describe('normalizeListingMode', () => {
  it('keeps contact listings and treats everything else as shop', () => {
    expect(normalizeListingMode('contact')).toBe('contact');
    expect(normalizeListingMode('shop')).toBe('shop');
    expect(normalizeListingMode(undefined)).toBe('shop');
  });
});
