import { ISubscriptionProvider } from "../providers/ISubscriptionProvider";

export type UserPlan = "FREE" | "PREMIUM";

export interface PlanLimits {
  maxProducts: number;
  autoCheckIntervalHours: number;
  manualChecksPerHour: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  FREE: {
    maxProducts: 2,
    autoCheckIntervalHours: 6,
    manualChecksPerHour: 1,
  },
  PREMIUM: {
    maxProducts: 10,
    autoCheckIntervalHours: 6, // Default, can be 1, 3, 6
    manualChecksPerHour: 5,
  },
};

export class SubscriptionService {
  private static provider: ISubscriptionProvider;

  /**
   * Initializes the service with a specific provider implementation.
   */
  static init(provider: ISubscriptionProvider) {
    this.provider = provider;
  }

  /**
   * Resolves the current active plan by querying the configured provider.
   */
  static async resolvePlan(): Promise<UserPlan> {
    if (!this.provider) {
      throw new Error("SubscriptionService not initialized with a provider.");
    }
    return this.provider.resolvePlan();
  }

  static getLimits(plan: UserPlan, customPremiumInterval?: number): PlanLimits {
    const baseLimits = PLAN_LIMITS[plan];
    if (plan === "PREMIUM" && customPremiumInterval) {
      return {
        ...baseLimits,
        autoCheckIntervalHours: customPremiumInterval,
      };
    }
    return baseLimits;
  }

  static canAddProduct(currentCount: number, plan: UserPlan): boolean {
    const limits = this.getLimits(plan);
    return currentCount < limits.maxProducts;
  }

  static canPerformManualCheck(
    checksInLastHour: number,
    plan: UserPlan,
  ): boolean {
    const limits = this.getLimits(plan);
    return checksInLastHour < limits.manualChecksPerHour;
  }

  /**
   * Synchronizes subscription status via the provider.
   */
  static async syncWithStore(): Promise<void> {
    if (!this.provider) {
      throw new Error("SubscriptionService not initialized with a provider.");
    }
    await this.provider.sync();
  }
}
