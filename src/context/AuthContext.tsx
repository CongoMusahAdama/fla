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

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('fla_user');
        const savedToken = localStorage.getItem('fla_token');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
        }
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
                // Fallback to mock for development
                if (identifier === 'fadlan@gmail.com' && password === 'fadlan') {
                    const mockUser: User = {
                        id: 'fadlan-unique-id',
                        name: 'Fadlan FLA',
                        email: identifier,
                        role: localStorage.getItem('last_intended_role') === 'vendor' ? 'vendor' : 'customer'
                    };
                    setUser(mockUser);
                    localStorage.setItem('fla_user', JSON.stringify(mockUser));
                    return;
                }
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            const loggedInUser: User = {
                id: data.user.id,
                name: data.user.name || identifier.split('@')[0],
                email: data.user.email,
                role: data.user.role || 'customer',
            };

            setUser(loggedInUser);
            localStorage.setItem('fla_user', JSON.stringify(loggedInUser));
            localStorage.setItem('fla_token', data.access_token);
        } catch (error) {
            // Fallback to mock login for development
            console.warn('API login failed, using mock login:', error);
            const mockUser: User = {
                id: 'mock-1',
                name: identifier.includes('@') ? identifier.split('@')[0] : 'Guest User',
                email: identifier.includes('@') ? identifier : 'guest@example.com',
                phone: !identifier.includes('@') ? identifier : undefined,
                role: localStorage.getItem('last_intended_role') === 'vendor' ? 'vendor' : 'customer'
            };
            setUser(mockUser);
            localStorage.setItem('fla_user', JSON.stringify(mockUser));
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
                    role,
                }),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            // Auto-login after successful registration
            await login(email, password);
        } catch (error) {
            console.warn('API signup failed, using mock signup:', error);
            // Fallback mock signup
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
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fla_user');
        localStorage.removeItem('fla_token');
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
