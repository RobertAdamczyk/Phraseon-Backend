import * as admin from "firebase-admin";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {SubscriptionPlanValue, SubscriptionPlan} from "../Model/subscriptionPlan";

/**
 * Checks the subscription status of a user.
 *
 * Retrieves the user data using the provided userId. Checks if the user's subscription is valid based on
 * the 'subscriptionValidUntil' field. Returns the user's subscription plan.
 *
 * @param {string} userId - The unique identifier of the user.
 * @return {Promise<SubscriptionPlanValue>} - Promise resolving to the SubscriptionPlanValue of the user.
 * @throws {HttpsError} - Throws error with ErrorCode.DatabaseError if the user does not exist.
 *                        Throws error with ErrorCode.AccessDenied if subscription data is missing or invalid.
 *                        Throws error with ErrorCode.AccessExpired if the subscription has expired.
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionPlanValue> {
  const db = admin.firestore();

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new HttpsError("not-found", ErrorCode.DatabaseError);
  }

  const userData = userDoc.data();
  const subscriptionValidUntil: Timestamp = userData?.subscriptionValidUntil;
  if (!subscriptionValidUntil) {
    throw new HttpsError("not-found", ErrorCode.AccessDenied);
  }

  const userSubscriptionPlan = userData?.subscriptionPlan;

  if (!userSubscriptionPlan) {
    throw new HttpsError("not-found", ErrorCode.AccessDenied);
  }

  const currentDate = new Date();
  const subscriptionValidUntilDate = subscriptionValidUntil.toDate();
  if (subscriptionValidUntilDate < currentDate) {
    throw new HttpsError("not-found", ErrorCode.AccessExpired);
  }

  return userSubscriptionPlan;
}

/**
 * Checks if the project owner has a Team subscription, only if the user making the request is not the project owner.
 *
 * This function first checks if the user making the request is different from the project owner.
 * If so, it then calls `checkProjectOwnerTeamSubscriptionPlan` to ensure the project owner has a Team subscription.
 *
 * @param {string} userId - The unique identifier of the user making the request.
 * @param {string} projectOwnerId - The unique identifier of the project owner.
 * @param {SubscriptionPlan} projectOwnerSubscriptionPlan - The subscription plan of the project owner.
 */
export function checkProjectOwnerTeamSubscriptionPlanIfNecessary(userId: string, projectOwnerId: string,
  projectOwnerSubscriptionPlan: SubscriptionPlanValue) {
  if (projectOwnerId != userId) {
    checkProjectOwnerTeamSubscriptionPlan(projectOwnerSubscriptionPlan);
  }
}

/**
 * Verifies if the provided subscription plan is Team.
 *
 * This function throws an error if the provided subscription plan is not Team.
 *
 * @param {SubscriptionPlan} projectOwnerSubscriptionPlan - The subscription plan to check.
 * @throws {HttpsError} - Throws 'not-found' error with ErrorCode.AccessExpired if the subscription plan is not Team.
 */
export function checkProjectOwnerTeamSubscriptionPlan(projectOwnerSubscriptionPlan: SubscriptionPlanValue) {
  if (projectOwnerSubscriptionPlan != SubscriptionPlan.current.team) {
    throw new HttpsError("not-found", ErrorCode.AccessDenied);
  }
}
