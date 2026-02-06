"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type CartItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    vendorId?: string;
};

type CartContextType = {
    cartItems: CartItem[];
    cartCount: number;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, size: string) => void;
    updateQuantity: (itemId: string, size: string, delta: number) => void;

    // UI States
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    isSupportOpen: boolean;
    setIsSupportOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // UI States
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Derived state
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const addToCart = (newItem: CartItem) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === newItem.id && item.size === newItem.size);
            if (existing) {
                return prev.map(item =>
                    (item.id === newItem.id && item.size === newItem.size)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, newItem];
        });
        setIsCartOpen(true); // Auto-open cart on add
    };

    const removeFromCart = (itemId: string, size: string) => {
        setCartItems(prev => prev.filter(item => !(item.id === itemId && item.size === size)));
    };

    const updateQuantity = (itemId: string, size: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === itemId && item.size === size) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            isCartOpen,
            setIsCartOpen,
            isSupportOpen,
            setIsSupportOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
