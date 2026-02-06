"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
};

type AuthContextType = {
    user: User | null;
    login: (identifier: string, password: string) => Promise<void>;
    signup: (name: string, email: string, phone: string, location: string, password: string, role?: UserRole, vendorData?: Partial<User>) => Promise<void>;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('fla_user');
        const savedToken = localStorage.getItem('fla_token');
        if (savedUser && savedToken) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user', e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: identifier, password }),
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
            };

            setUser(loggedInUser);
            localStorage.setItem('fla_user', JSON.stringify(loggedInUser));
            localStorage.setItem('fla_token', data.access_token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (name: string, email: string, phone: string, location: string, password: string, role: UserRole = 'customer', vendorData?: Partial<User>) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    phone,
                    location,
                    role,
                    ...vendorData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Registration failed');
            }

            // Auto-login after successful registration
            await login(email, password);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fla_user');
        localStorage.removeItem('fla_token');
    };

    const updateUser = (updatedData: Partial<User>) => {
        if (!user) return;
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('fla_user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            updateUser,
            isAuthenticated: !!user,
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
