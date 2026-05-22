"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type UserRole = 'customer' | 'admin' | 'vendor';

export type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    address?: string;
    role: UserRole;
    profileImage?: string;
    bannerImage?: string;
    // Vendor specific
    shopName?: string;
    productTypes?: string;
    accountName?: string;
    momoNumber?: string;
    bio?: string;
    idFile?: any;
    logoFile?: any;
    status?: string;
    uniqueVendorId?: string;
    walletBalance?: number;
    pendingBalance?: number;
    region?: string;
    // KYC / Identity fields
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
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    login: (identifier: string, password: string) => Promise<User>;
    signup: (name: string, email: string, phone: string, location: string, region: string, password: string, role?: UserRole, vendorData?: Partial<User>, turnstileToken?: string) => Promise<{ user: User; requiresEmailVerification: boolean; otpSent?: boolean; message?: string }>;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseStoredUser(): User | null {
    try {
        const raw = localStorage.getItem('fla_user');
        if (!raw) return null;
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedUser = parseStoredUser();
        const storedToken = localStorage.getItem('fla_token');
        
        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    // Validate token silently in the background — if invalid, clear session
    useEffect(() => {
        const storedToken = localStorage.getItem('fla_token');
        if (!storedToken) return;

        // Non-blocking background token validation
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (!res.ok) {
                    // Token expired — clear silently
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('fla_user');
                    localStorage.removeItem('fla_token');
                }
            } catch (e) {
                // Network error — keep local session, don't log out
            }
        }, 2000); // Check after 2s so page loads first

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, []);

    const login = useCallback(async (identifier: string, password: string): Promise<User> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                // Always send lowercase email to match backend storage
                email: identifier.toLowerCase().trim(),
                password
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid credentials');
        }

        const data = await response.json();

        const loggedInUser: User = {
            id: data.user.id || data.user._id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            location: data.user.location,
            address: data.user.address,
            role: data.user.role || 'customer',
            profileImage: data.user.profileImage,
            bannerImage: data.user.bannerImage,
            shopName: data.user.shopName,
            momoNumber: data.user.momoNumber,
            accountName: data.user.accountName,
            bio: data.user.bio,
            productTypes: data.user.productTypes,
            status: data.user.status,
            uniqueVendorId: data.user.uniqueVendorId,
            walletBalance: data.user.walletBalance,
            pendingBalance: data.user.pendingBalance,
            region: data.user.region,
            vendorTier: data.user.vendorTier,
        };

        setUser(loggedInUser);
        setToken(data.access_token);
        localStorage.setItem('fla_user', JSON.stringify(loggedInUser));
        localStorage.setItem('fla_token', data.access_token);
        return loggedInUser;
    }, []);

    const signup = useCallback(async (
        name: string, email: string, phone: string, location: string, region: string,
        password: string, role: UserRole = 'customer', vendorData?: Partial<User>,
        turnstileToken?: string
    ): Promise<{ user: User; requiresEmailVerification: boolean; otpSent?: boolean; message?: string }> => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password, name, phone, location, region, role,
                turnstileToken,
                ...vendorData
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
            id: raw._id || raw.id,
            name: raw.name,
            email: raw.email,
            phone: raw.phone,
            location: raw.location,
            role: registeredRole,
            shopName: raw.shopName,
            status: raw.status,
            region: raw.region,
        };

        // Vendors must verify email before login — never auto-login after register
        const needsEmailVerification =
            data.requiresEmailVerification === true || registeredRole === 'vendor';

        if (needsEmailVerification) {
            return {
                user: registeredUser,
                requiresEmailVerification: true,
                otpSent: data.otpSent !== false,
                message: data.message,
            };
        }

        const loggedInUser = await login(email, password);
        return {
            user: loggedInUser,
            requiresEmailVerification: false,
            message: data.message,
        };
    }, [login]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch { /* ignore */ }
        setUser(null);
        setToken(null);
        localStorage.removeItem('fla_user');
        localStorage.removeItem('fla_token');
    }, []);

    const updateUser = useCallback((updatedData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const newUser = { ...prev, ...updatedData };
            localStorage.setItem('fla_user', JSON.stringify(newUser));
            return newUser;
        });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            signup,
            logout,
            updateUser,
            isAuthenticated: !!user && !!token,
            isLoading
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
