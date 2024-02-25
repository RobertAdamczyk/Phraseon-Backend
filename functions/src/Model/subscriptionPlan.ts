import {getConfiguration} from "../Common/getConfiguration";

export enum SubscriptionPlanValue {
  monthlyInHouse = "robert.adamczyk.phraseon.inhouse.subscription.plan.monthly",
  yearlyInHouse = "robert.adamczyk.phraseon.inhouse.subscription.plan.yearly",
  monthlyLive = "robert.adamczyk.phraseon.live.subscription.plan.monthly",
  yearlyLive = "robert.adamczyk.phraseon.live.subscription.plan.yearly",
}

/**
 * The `SubscriptionPlan` class provides access to subscription plan details
 * based on the current environment of the application.
 *
 * This class utilizes a static getter to dynamically return subscription plan
 * details (individual or team plans) tailored to either a Production or Sandbox environment.
 * The environment is determined at runtime, allowing for flexible deployment configurations.
 *
 * Usage:
 * ```
 * const currentPlanDetails = SubscriptionPlan.current;
 * console.log(currentPlanDetails.monthly); // Access monthly plan details for the current environment
 * console.log(currentPlanDetails.yearly); // Access yearly plan details for the current environment
 * ```
 *
 * Note: It relies on the `getConfiguration` function to determine the current environment,
 * and the `SubscriptionPlanValue` enum to provide the specific values for monthly and yearly plans
 * in both Production and Sandbox environments.
 */
export class SubscriptionPlan {
  private static readonly environment = getConfiguration().build;

  /**
   * A static getter that dynamically returns the subscription plan details
   * based on the current environment of the application.
   *
   * It returns an object containing the details for both monthly and yearly plans,
   * selecting between Production and Sandbox configurations as defined in the `enums` object.
   *
   * @return {SubscriptionPlanValue} An object with `monthly` and `yearly` properties containing
   * subscription plan details for the current environment.
   */
  static get current() {
    const enums = {
      live: {
        monthly: SubscriptionPlanValue.monthlyLive,
        yearly: SubscriptionPlanValue.yearlyLive,
      },
      inhouse: {
        monthly: SubscriptionPlanValue.monthlyInHouse,
        yearly: SubscriptionPlanValue.yearlyInHouse,
      },
    };

    return enums[this.environment];
  }
}
