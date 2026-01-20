import { create } from "zustand";
import { Product, HistoryEntry } from "../../core/entities/Product";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";

interface ProductState {
  products: Product[];
  history: HistoryEntry[];
  checkInterval: number; // in minutes
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setCheckInterval: (interval: number) => void;
  clearHistory: (productId: string) => void;
  clearProducts: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: [],
      history: [],
      checkInterval: 60, // Default 1 hour
      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          history: state.history.filter((h) => h.productId !== id),
        })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      addHistoryEntry: (entry) =>
        set((state) => ({ history: [entry, ...state.history] })),
      setCheckInterval: (interval) => set(() => ({ checkInterval: interval })),
      clearHistory: (productId) =>
        set((state) => ({
          history: state.history.filter((h) => h.productId !== productId),
        })),
      clearProducts: () => set(() => ({ products: [], history: [] })),
    }),
    {
      name: "product-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
