"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'customer' | 'admin' | 'vendor';

export type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    role: UserRole;
    // Vendor specific
    shopName?: string;
    productTypes?: string;
    accountName?: string;
    momoNumber?: string;
    idFile?: any;
    logoFile?: any;
};

type AuthContextType = {
    user: User | null;
    login: (identifier: string, password: string) => Promise<void>;
    signup: (name: string, email: string, phone: string, location: string, password: string, role?: UserRole, vendorData?: Partial<User>) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Mock persistence
    useEffect(() => {
        const savedUser = localStorage.getItem('fla_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = async (identifier: string, password: string) => {
        // Mock login
        // Check if identifier is email or looks like phone
        const mockUser: User = {
            id: '1',
            name: identifier.includes('@') ? identifier.split('@')[0] : 'Guest User',
            email: identifier.includes('@') ? identifier : 'guest@example.com',
            phone: !identifier.includes('@') ? identifier : undefined,
            role: 'customer' // Default role
        };
        setUser(mockUser);
        localStorage.setItem('fla_user', JSON.stringify(mockUser));
    };

    const signup = async (name: string, email: string, phone: string, location: string, password: string, role: UserRole = 'customer', vendorData?: Partial<User>) => {
        // Mock signup
        const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone,
            location,
            role,
            ...vendorData
        };
        setUser(mockUser);
        localStorage.setItem('fla_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fla_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            isAuthenticated: !!user
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
