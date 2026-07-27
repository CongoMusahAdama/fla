"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type UserRole = 'customer' | 'admin' | 'vendor';

export type User = {
    _id?: string;
    userId?: string;
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    address?: string;
    role: UserRole;
    profileImage?: string;
    bannerImage?: string;
    shopName?: string;
    productTypes?: string;
    storeAccentColor?: string;
    storeThemeColor?: string;
    accountName?: string;
    momoNumber?: string;
    bio?: string;
    idFile?: any;
    logoFile?: any;
    status?: string;
    uniqueVendorId?: string;
    storeSlug?: string;
    mustChangePassword?: boolean;
    kycApprovedAt?: string | Date | null;
    kycSubmittedAt?: string | Date | null;
    subscriptionPlan?: 'intro' | 'monthly' | 'trial' | 'annual' | string;
    subscriptionLabel?: string;
    subscriptionPriceText?: string;
    subscriptionPriceGhs?: number;
    subscriptionStartsAt?: string | Date | null;
    subscriptionEndsAt?: string | Date | null;
    /** KYC approved but must pay via Paystack before uploads */
    subscriptionPaymentRequired?: boolean;
    subscriptionLastPaidAt?: string | Date | null;
    walletBalance?: number;
    pendingBalance?: number;
    region?: string;
    ghanaCardNumber?: string;
    ghanaCardFront?: string;
    ghanaCardBack?: string;
    selfie?: string;
    utilityBill?: string;
    utilityType?: string;
    businessRegistration?: string;
    digitalAddress?: string;
    dob?: string;
    employeeCount?: string;
    yearsOfExistence?: string;
    paymentMethods?: any[];
    vendorTier?: 'low' | 'high';
    termsAcceptedAt?: string | Date | null;
    termsVersion?: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    login: (identifier: string, password: string) => Promise<User>;
    signup: (name: string, email: string, phone: string, location: string, region: string, password: string, role?: UserRole, vendorData?: Partial<User>, turnstileToken?: string) => Promise<{ user: User; requiresEmailVerification: boolean; otpSent?: boolean; message?: string; loginFailed?: boolean }>;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
    changePassword: (currentPassword: string, newPassword: string) => Promise<User>;
    acceptTerms: (version: string) => Promise<User>;
    isAuthenticated: boolean;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapApiUser(raw: Record<string, unknown>): User {
    return {
        id: String(raw.id || raw._id || ''),
        name: String(raw.name || ''),
        email: String(raw.email || ''),
        phone: raw.phone as string | undefined,
        location: raw.location as string | undefined,
        address: raw.address as string | undefined,
        role: (raw.role as UserRole) || 'customer',
        profileImage: raw.profileImage as string | undefined,
        bannerImage: raw.bannerImage as string | undefined,
        shopName: raw.shopName as string | undefined,
        momoNumber: raw.momoNumber as string | undefined,
        accountName: raw.accountName as string | undefined,
        bio: raw.bio as string | undefined,
        productTypes: raw.productTypes as string | undefined,
        storeAccentColor: raw.storeAccentColor as string | undefined,
        storeThemeColor: raw.storeThemeColor as string | undefined,
        status: raw.status as string | undefined,
        uniqueVendorId: raw.uniqueVendorId as string | undefined,
        storeSlug: raw.storeSlug as string | undefined,
        mustChangePassword: Boolean(raw.mustChangePassword),
        kycApprovedAt: (raw.kycApprovedAt as string | Date | null | undefined) ?? null,
        kycSubmittedAt: (raw.kycSubmittedAt as string | Date | null | undefined) ?? null,
        subscriptionPlan: raw.subscriptionPlan as string | undefined,
        subscriptionLabel: raw.subscriptionLabel as string | undefined,
        subscriptionPriceText: raw.subscriptionPriceText as string | undefined,
        subscriptionPriceGhs: raw.subscriptionPriceGhs as number | undefined,
        subscriptionStartsAt: (raw.subscriptionStartsAt as string | Date | null | undefined) ?? null,
        subscriptionEndsAt: (raw.subscriptionEndsAt as string | Date | null | undefined) ?? null,
        subscriptionPaymentRequired: Boolean(raw.subscriptionPaymentRequired),
        subscriptionLastPaidAt: (raw.subscriptionLastPaidAt as string | Date | null | undefined) ?? null,
        ghanaCardFront: raw.ghanaCardFront as string | undefined,
        ghanaCardBack: raw.ghanaCardBack as string | undefined,
        selfie: raw.selfie as string | undefined,
        businessRegistration: raw.businessRegistration as string | undefined,
        walletBalance: raw.walletBalance as number | undefined,
        pendingBalance: raw.pendingBalance as number | undefined,
        region: raw.region as string | undefined,
        vendorTier: raw.vendorTier as 'low' | 'high' | undefined,
        termsAcceptedAt: raw.termsAcceptedAt as string | Date | null | undefined,
        termsVersion: raw.termsVersion as string | undefined,
        paymentMethods: raw.paymentMethods as any[] | undefined,
    };
}

function persistSession(user: User, accessToken: string | null) {
    localStorage.setItem('fla_user', JSON.stringify(user));
    if (accessToken) {
        localStorage.setItem('fla_token', accessToken);
    }
}

function clearStoredSession() {
    localStorage.removeItem('fla_user');
    localStorage.removeItem('fla_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session on mount: validate with API before marking ready (prevents refresh logout)
    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            const storedToken = localStorage.getItem('fla_token');
            const headers: HeadersInit = {};
            if (storedToken) {
                headers.Authorization = `Bearer ${storedToken}`;
            }

            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers,
                    credentials: 'include',
                });

                if (cancelled) return;

                if (res.ok) {
                    const data = await res.json();
                    const restoredUser = mapApiUser(data.user || {});
                    const accessToken = data.access_token || storedToken;
                    setUser(restoredUser);
                    setToken(accessToken);
                    persistSession(restoredUser, accessToken);
                    return;
                }

                // Invalid or expired session
                setUser(null);
                setToken(null);
                clearStoredSession();
            } catch {
                // Offline / API unreachable — fall back to cached session so refresh still works
                if (cancelled) return;
                try {
                    const raw = localStorage.getItem('fla_user');
                    if (raw && storedToken) {
                        setUser(JSON.parse(raw) as User);
                        setToken(storedToken);
                        return;
                    }
                } catch {
                    /* ignore */
                }
                setUser(null);
                setToken(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        restoreSession();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (identifier: string, password: string): Promise<User> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: identifier.toLowerCase().trim(),
                password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid credentials');
        }

        const data = await response.json();
        const loggedInUser = mapApiUser(data.user || {});

        setUser(loggedInUser);
        setToken(data.access_token);
        persistSession(loggedInUser, data.access_token);
        return loggedInUser;
    }, []);

    const signup = useCallback(async (
        name: string, email: string, phone: string, location: string, region: string,
        password: string, role: UserRole = 'customer', vendorData?: Partial<User>,
        turnstileToken?: string
    ): Promise<{ user: User; requiresEmailVerification: boolean; otpSent?: boolean; message?: string; loginFailed?: boolean }> => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password, name, phone, location, region, role,
                turnstileToken,
                ...vendorData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const rawMsg = errorData.message;
            const message = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
            throw new Error(message || 'Registration failed');
        }

        const data = await response.json();
        const raw = data.user || data;
        const registeredRole = (raw.role || role) as UserRole;
        const registeredUser: User = {
            ...mapApiUser(raw),
            role: registeredRole,
        };

        const needsEmailVerification = data.requiresEmailVerification === true;

        if (needsEmailVerification) {
            return {
                user: registeredUser,
                requiresEmailVerification: true,
                otpSent: data.otpSent !== false,
                message: data.message,
            };
        }

        try {
            const loggedInUser = await login(email, password);
            return {
                user: loggedInUser,
                requiresEmailVerification: false,
                message: data.message,
            };
        } catch {
            return {
                user: registeredUser,
                requiresEmailVerification: false,
                message:
                    (data.message || 'Account created successfully.') +
                    ' Please sign in with your email and password.',
                loginFailed: true,
            };
        }
    }, [login]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch { /* ignore */ }
        setUser(null);
        setToken(null);
        clearStoredSession();
    }, []);

    const updateUser = useCallback((updatedData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            // Do not overwrite existing fields with undefined from a partial API payload
            const cleaned = Object.fromEntries(
                Object.entries(updatedData).filter(([, v]) => v !== undefined),
            ) as Partial<User>;
            const newUser = { ...prev, ...cleaned };
            localStorage.setItem('fla_user', JSON.stringify(newUser));
            return newUser;
        });
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<User> => {
        const authToken = token || localStorage.getItem('fla_token');
        if (!authToken) throw new Error('You must be signed in to change your password.');

        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Could not change password');
        }

        const data = await response.json();
        const updatedUser = mapApiUser(data);
        setUser(updatedUser);
        persistSession(updatedUser, authToken);
        return updatedUser;
    }, [token]);

    const acceptTerms = useCallback(async (version: string): Promise<User> => {
        const authToken = token || localStorage.getItem('fla_token');
        if (!authToken) throw new Error('You must be signed in to accept terms.');

        const response = await fetch(`${API_URL}/auth/accept-terms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ version }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Could not save your acceptance.');
        }

        const data = await response.json();
        const raw = data.user || {};
        let updatedUser: User | null = null;
        setUser(prev => {
            if (!prev) return null;
            updatedUser = {
                ...prev,
                termsAcceptedAt: raw.termsAcceptedAt,
                termsVersion: raw.termsVersion,
            };
            localStorage.setItem('fla_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
        if (!updatedUser) throw new Error('No active session');
        return updatedUser;
    }, [token]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            signup,
            logout,
            updateUser,
            changePassword,
            acceptTerms,
            isAuthenticated: !!user && !!token,
            isLoading,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function getStoredAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fla_token');
}
