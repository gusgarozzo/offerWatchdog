import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { useProductStore } from "../../ui/hooks/useProductStore";
import { ScraperService } from "./ScraperService";
import Constants from "expo-constants";

import { SyncService } from "./SyncService";

const BACKGROUND_FETCH_TASK = "background-product-check";

// Define task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await SyncService.checkAllProducts();
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
