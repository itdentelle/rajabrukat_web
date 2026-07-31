import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  image: string;
  category: string;
  description?: string;
  size?: string;
  color?: string;
  colors?: string[];
  sizeGuide?: string | null;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: string;
}

import { persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  fetchCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      fetchCart: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        try {
          const res = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const formattedItems = data.map((item: any) => ({
              ...item.product,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              cartItemId: `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`
            }));
            set({ items: formattedItems });
          }
        } catch(err) { console.error('Failed to fetch cart', err); }
      },
      mergeCart: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const currentItems = get().items;
        if (currentItems.length === 0) return get().fetchCart();
        
        try {
          const payload = currentItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color
          }));
          const res = await fetch('http://localhost:5000/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ items: payload })
          });
          if (res.ok) {
            const data = await res.json();
            const formattedItems = data.map((item: any) => ({
              ...item.product,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              cartItemId: `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`
            }));
            set({ items: formattedItems });
          }
        } catch(err) { console.error('Failed to merge cart', err); }
      },
      addItem: (product) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        set((state) => {
          const cartItemId = `${product.id}-${product.size || 'default'}-${product.color || 'default'}`;
          const existingItem = state.items.find((item) => item.cartItemId === cartItemId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1, cartItemId }] };
        });

        if (token) {
          fetch('http://localhost:5000/api/cart/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: product.id, quantity: 1, size: product.size, color: product.color })
          }).catch(err => console.error(err));
        }
      },
      removeItem: (cartItemId) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const itemToRemove = get().items.find(i => i.cartItemId === cartItemId);
        
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));

        if (token && itemToRemove) {
          fetch(`http://localhost:5000/api/cart/items/${itemToRemove.id}?size=${itemToRemove.size || 'default'}&color=${itemToRemove.color || 'default'}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(err => console.error(err));
        }
      },
      updateQuantity: (cartItemId, quantity) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const targetItem = get().items.find(i => i.cartItemId === cartItemId);
        
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: Math.max(0, quantity) } : item
          ).filter(item => item.quantity > 0),
        }));

        if (token && targetItem) {
          fetch('http://localhost:5000/api/cart/items', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: targetItem.id, size: targetItem.size, color: targetItem.color, quantity })
          }).catch(err => console.error(err));
        }
      },
      clearCart: () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        set({ items: [] });
        if (token) {
          fetch('http://localhost:5000/api/cart', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(err => console.error(err));
        }
      },
      totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: () => get().items.reduce((total, item) => {
        const effectivePrice = item.discountPrice ?? item.price;
        return total + effectivePrice * item.quantity;
      }, 0),
    }),
    {
      name: 'dragonworm-cart', // nama key di localStorage
      partialize: (state) => ({ items: state.items }), // Hanya simpan items, bukan state isOpen
    }
  )
);
