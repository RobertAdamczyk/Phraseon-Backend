import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {db} from "./firebaseConfiguration";

/**
 * Checks the subscription status of a user.
 *
 * Retrieves the user data using the provided userId. Checks if the user's subscription is valid based on
 * the 'subscriptionValidUntil' field. Returns the user's subscription plan.
 *
 * @param {string} userId - The unique identifier of the user.
 * @throws {HttpsError} - Throws error with ErrorCode.DatabaseError if the user does not exist.
 *                        Throws error with ErrorCode.AccessDenied if subscription data is missing or invalid.
 *                        Throws error with ErrorCode.AccessExpired if the subscription has expired.
 */
export async function checkUserSubscription(userId: string) {
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
}
