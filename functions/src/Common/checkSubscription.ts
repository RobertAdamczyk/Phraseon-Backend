import * as admin from "firebase-admin";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {SubscriptionPlan} from "../Model/subscriptionPlan";

/**
 * Checks the subscription status of a user.
 *
 * Retrieves the user data using the provided userId. Checks if the user's subscription is valid based on
 * the 'subscriptionValidUntil' field. Returns the user's subscription plan.
 *
 * @param {string} userId - The unique identifier of the user.
 * @return {Promise<SubscriptionPlan>} - Promise resolving to the SubscriptionPlan of the user.
 * @throws {HttpsError} - Throws error with ErrorCode.DatabaseError if the user does not exist.
 *                        Throws error with ErrorCode.AccessDenied if subscription data is missing or invalid.
 *                        Throws error with ErrorCode.AccessExpired if the subscription has expired.
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionPlan> {
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
 * Checks if the project owner has a GOLD subscription plan, and if the requesting user is the project owner.
 *
 * This function compares the provided projectOwnerId with the userId to
 * determine if the user making the request is the project owner.
 * It then checks if the project owner's subscription plan is GOLD.
 *
 * @param {string} userId - The unique identifier of the user making the request.
 * @param {string} projectOwnerId - The unique identifier of the project owner.
 * @param {SubscriptionPlan} projectOwnerSubscriptionPlan - The subscription plan of the project owner.
 * @throws {HttpsError} - Throws 'not-found' error with ErrorCode.AccessExpired if the user is not the project
 *                        owner or if the project owner does not have a GOLD subscription plan.
 */
export function checkProjectOwnerGoldSubscriptionPlanIfNecessary(userId: string, projectOwnerId: string,
  projectOwnerSubscriptionPlan: SubscriptionPlan) {
  if (projectOwnerId != userId && projectOwnerSubscriptionPlan != SubscriptionPlan.gold) {
    throw new HttpsError("not-found", ErrorCode.AccessExpired);
  }
}
