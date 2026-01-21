import { UserPlan } from "../services/SubscriptionService";

export interface ISubscriptionProvider {
  /**
   * Resolves the current plan based on the provider's specific source
   * (e.g. mock data or native store APIs).
   */
  resolvePlan(): Promise<UserPlan>;

  /**
   * Synchronizes the subscription status with the remote source.
   */
  sync(): Promise<void>;
}
