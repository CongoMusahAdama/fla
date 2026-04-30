"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type CartItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
    vendorId?: string;
    vendorName?: string;
    vendorRegion?: string;
};

type CartContextType = {
    cartItems: CartItem[];
    cartCount: number;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, size: string, color: string) => void;
    updateQuantity: (itemId: string, size: string, color: string, delta: number) => void;

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

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('fla_cart');
        if (stored) {
            try {
                setCartItems(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save to localStorage when items change
    useEffect(() => {
        if (cartItems.length > 0 || localStorage.getItem('fla_cart')) {
            localStorage.setItem('fla_cart', JSON.stringify(cartItems));
        }
    }, [cartItems]);

    const contextValue = React.useMemo(() => ({
        cartItems,
        cartCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        addToCart: (newItem: CartItem) => {
            setCartItems(prev => {
                const existing = prev.find(item => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color);
                if (existing) {
                    return prev.map(item =>
                        (item.id === newItem.id && item.size === newItem.size && item.color === newItem.color)
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
                return [...prev, newItem];
            });
            setIsCartOpen(true);
        },
        removeFromCart: (itemId: string, size: string, color: string) => {
            setCartItems(prev => prev.filter(item => !(item.id === itemId && item.size === size && item.color === color)));
        },
        updateQuantity: (itemId: string, size: string, color: string, delta: number) => {
            setCartItems(prev => prev.map(item => {
                if (item.id === itemId && item.size === size && item.color === color) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }));
        },
        isCartOpen,
        setIsCartOpen,
        isSupportOpen,
        setIsSupportOpen
    }), [cartItems, isCartOpen, isSupportOpen]);

    return (
        <CartContext.Provider value={contextValue}>
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
