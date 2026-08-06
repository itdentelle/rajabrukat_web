import { create } from 'zustand';
import { Product } from './cartStore';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

interface WishlistState {
  items: Product[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  
  fetchWishlist: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ items: [], isLoading: false });
      return;
    }
    
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ items: data, isLoading: false });
      } else {
        set({ items: [], isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      set({ items: [], isLoading: false });
    }
  },

  toggleWishlist: async (productId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error("Please login to save items to your wishlist.");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ productId })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Re-fetch to sync
        await get().fetchWishlist();
        if (data.added) {
          toast.success("Added to wishlist");
          return true;
        } else {
          toast.success("Removed from wishlist");
          return false;
        }
      } else {
        toast.error("Failed to update wishlist.");
        return false;
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      toast.error("An error occurred.");
      return false;
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some(item => item.id === productId);
  }
}));
