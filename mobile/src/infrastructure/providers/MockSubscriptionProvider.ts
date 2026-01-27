import { ISubscriptionProvider } from "../../core/providers/ISubscriptionProvider";
import { UserPlan } from "../../core/services/SubscriptionService";

export class MockSubscriptionProvider implements ISubscriptionProvider {
  /**
   * In a QA/Dev build, this can be hardcoded or read from a build config.
   * Testing different plans is done by providing different build versions
   * with this value swapped.
   */
  async resolvePlan(): Promise<UserPlan> {
    // Default to PREMIUM for testing, can be changed to FREE for standard testing
    return "PREMIUM";
  }

  async sync(): Promise<void> {
    // Simulate network delay for sync
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
}
