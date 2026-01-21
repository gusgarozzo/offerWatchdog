import { useProductStore } from "../../ui/hooks/useProductStore";
import { ScraperService } from "./ScraperService";
import * as Notifications from "expo-notifications";

const scraper = new ScraperService();

export class SyncService {
  static async checkAllProducts() {
    console.log("[SyncService] Starting check for all products...");
    const { products, updateProduct, addHistoryEntry } =
      useProductStore.getState();

    for (const product of products) {
      try {
        const info = await scraper.scrape(product.url);

        // Price check
        if (info.price !== null && info.price !== product.price) {
          const oldPrice = product.price;
          updateProduct(product.id, {
            price: info.price,
            lastChecked: Date.now(),
          });

          addHistoryEntry({
            id: Date.now().toString(),
            productId: product.id,
            timestamp: Date.now(),
            type: "price",
            oldValue: oldPrice,
            newValue: info.price,
          });

          this.notify(
            "¡Cambio de precio!",
            `${product.name} cambió de $${oldPrice} a $${info.price}`,
            product.id,
          );
        }

        // Availability check
        if (
          info.availability !== null &&
          info.availability !== product.availability
        ) {
          const oldAvailability = product.availability;
          updateProduct(product.id, {
            availability: info.availability,
            lastChecked: Date.now(),
          });

          addHistoryEntry({
            id: (Date.now() + 1).toString(),
            productId: product.id,
            timestamp: Date.now(),
            type: "availability",
            oldValue: oldAvailability,
            newValue: info.availability,
          });

          this.notify(
            "Cambio de stock",
            `${product.name} ahora está ${info.availability}`,
            product.id,
          );
        }

        // Always update lastChecked even if no changes
        updateProduct(product.id, { lastChecked: Date.now() });
      } catch (error) {
        console.error(
          `[SyncService] Failed to check product ${product.id}:`,
          error,
        );
      }
    }
  }

  private static async notify(title: string, body: string, productId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { productId },
        },
        trigger: null,
      });
    } catch (e) {
      console.warn("[SyncService] Notification failed:", e);
    }
  }
}
