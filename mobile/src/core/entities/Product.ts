export interface Product {
  id: string;
  url: string;
  name: string;
  price: number | null;
  availability: string | null;
  lastChecked: number;
  createdAt: number;
  image?: string;
}

export interface HistoryEntry {
  id: string;
  productId: string;
  timestamp: number;
  type: "price" | "availability";
  oldValue: string | number | null;
  newValue: string | number | null;
}
