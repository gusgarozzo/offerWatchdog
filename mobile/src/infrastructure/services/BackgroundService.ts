import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { useProductStore } from "../../ui/hooks/useProductStore";
import { ScraperService } from "./ScraperService";
import { SubscriptionService } from "../../core/services/SubscriptionService";
import Constants from "expo-constants";

import { SyncService } from "./SyncService";

const BACKGROUND_FETCH_TASK = "background-product-check";

// Define task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { products, userPlan, checkInterval, lastAutoCheckTimestamp } =
      useProductStore.getState();

    // 1. Plan Interval Check
    const limits = SubscriptionService.getLimits(userPlan, checkInterval);
    const now = Date.now();
    const minWaitMs = limits.autoCheckIntervalHours * 60 * 60 * 1000;

    if (now - lastAutoCheckTimestamp < minWaitMs) {
      console.log(
        `[BackgroundFetch] Skipping check. Min wait is ${limits.autoCheckIntervalHours}h`,
      );
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (products.length === 0)
      return BackgroundFetch.BackgroundFetchResult.NoData;

    // 2. Perform sync using SyncService
    await SyncService.checkAllProducts();

    // 3. Update the last auto check timestamp
    useProductStore.setState({ lastAutoCheckTimestamp: Date.now() });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  if (Constants.appOwnership === "expo") {
    return;
  }

  const { userPlan, checkInterval } = useProductStore.getState();
  const limits = SubscriptionService.getLimits(userPlan, checkInterval);

  // We register it with a minimum interval, but the task itself double checks
  // for stricter control (like the 6h for Free)
  const intervalInSeconds = Math.max(limits.autoCheckIntervalHours * 3600, 60);

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK,
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    }

    return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: intervalInSeconds,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.warn("BackgroundFetch.registerTaskAsync failed:", error);
  }
}
