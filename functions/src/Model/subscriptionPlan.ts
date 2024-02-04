import {getConfiguration} from "../Common/getConfiguration";

export enum SubscriptionPlanValue {
  individualInHouse = "robert.adamczyk.phraseon.inhouse.subscription.plan.individual",
  teamInHouse = "robert.adamczyk.phraseon.inhouse.subscription.plan.team",
  individualLive = "robert.adamczyk.phraseon.live.subscription.plan.individual",
  teamLive = "robert.adamczyk.phraseon.live.subscription.plan.team",
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
 * console.log(currentPlanDetails.individual); // Access individual plan details for the current environment
 * console.log(currentPlanDetails.team); // Access team plan details for the current environment
 * ```
 *
 * Note: It relies on the `getConfiguration` function to determine the current environment,
 * and the `SubscriptionPlanValue` enum to provide the specific values for individual and team plans
 * in both Production and Sandbox environments.
 */
export class SubscriptionPlan {
  private static readonly environment = getConfiguration().build;

  /**
   * A static getter that dynamically returns the subscription plan details
   * based on the current environment of the application.
   *
   * It returns an object containing the details for both individual and team plans,
   * selecting between Production and Sandbox configurations as defined in the `enums` object.
   *
   * @return {SubscriptionPlanValue} An object with `individual` and `team` properties containing
   * subscription plan details for the current environment.
   */
  static get current() {
    const enums = {
      live: {
        individual: SubscriptionPlanValue.individualLive,
        team: SubscriptionPlanValue.teamLive,
      },
      inhouse: {
        individual: SubscriptionPlanValue.individualInHouse,
        team: SubscriptionPlanValue.teamInHouse,
      },
    };

    return enums[this.environment];
  }
}
