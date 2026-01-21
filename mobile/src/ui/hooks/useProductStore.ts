import { create } from "zustand";
import { Product, HistoryEntry } from "../../core/entities/Product";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SubscriptionService,
  UserPlan,
} from "../../core/services/SubscriptionService";

interface ProductState {
  products: Product[];
  history: HistoryEntry[];
  checkInterval: number; // in hours for Premium, default 1
  manualCheckTimestamps: number[];
  lastAutoCheckTimestamp: number;
  userPlan: UserPlan;

  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setCheckInterval: (interval: number) => void;
  clearHistory: (productId: string) => void;
  clearProducts: () => void;
  recordManualCheck: () => void;

  // Subscription Actions
  syncSubscription: () => Promise<void>;
  updateUserPlan: (plan: UserPlan) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      history: [],
      checkInterval: 1, // Default 1 hour for Premium
      manualCheckTimestamps: [],
      lastAutoCheckTimestamp: 0,
      userPlan: "FREE",

      addProduct: (product) => {
        const { products, userPlan } = get();
        if (SubscriptionService.canAddProduct(products.length, userPlan)) {
          set((state) => ({ products: [...state.products, product] }));
        }
      },
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
      recordManualCheck: () => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        set((state) => ({
          manualCheckTimestamps: [
            ...state.manualCheckTimestamps.filter((t) => t > oneHourAgo),
            now,
          ],
        }));
      },

      syncSubscription: async () => {
        await SubscriptionService.syncWithStore();
        const resolvedPlan = await SubscriptionService.resolvePlan();
        set({ userPlan: resolvedPlan });
      },
      updateUserPlan: (plan) => set({ userPlan: plan }),
    }),
    {
      name: "product-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
