import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { useProductStore } from "../../ui/hooks/useProductStore";
import { ScraperService } from "./ScraperService";
import Constants from "expo-constants";

const BACKGROUND_FETCH_TASK = "background-product-check";
const scraper = new ScraperService();

// Define task (always define it, but execution depends on platform)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { products, updateProduct, addHistoryEntry } =
      useProductStore.getState();

    for (const product of products) {
      const info = await scraper.scrape(product.url);

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

        // Local notification (only if possible)
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "¡Cambio de precio!",
              body: `${product.name} cambió de $${oldPrice} a $${info.price}`,
              data: { productId: product.id },
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore notification failures in Expo Go
        }
      }

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

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Cambio de stock",
              body: `${product.name} ahora está ${info.availability}`,
              data: { productId: product.id },
            },
            trigger: null,
          });
        } catch (e) {
          // Ignore
        }
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  // Defensive check for Expo Go
  if (Constants.appOwnership === "expo") {
    return;
  }

  const { checkInterval } = useProductStore.getState();

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK,
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    }

    return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: checkInterval * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.warn("BackgroundFetch.registerTaskAsync failed:", error);
  }
}
