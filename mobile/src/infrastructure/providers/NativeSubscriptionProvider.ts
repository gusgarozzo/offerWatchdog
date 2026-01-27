import { ISubscriptionProvider } from "../../core/providers/ISubscriptionProvider";
import { UserPlan } from "../../core/services/SubscriptionService";

export class NativeSubscriptionProvider implements ISubscriptionProvider {
  /**
   * Real implementation using native in-app purchase APIs.
   * (e.g. expo-in-app-purchases or react-native-purchases)
   */
  async resolvePlan(): Promise<UserPlan> {
    // In a real implementation, we would query the native store here.
    // storeState would be fetched from the native modules.
    return "FREE";
  }

  async sync(): Promise<void> {
    // Logic to refresh receipts and status from the store
  }
}
