import * as admin from "firebase-admin";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v1";
import {Timestamp} from "firebase-admin/firestore";
import {SubscriptionPlan} from "../Model/subscriptionPlan";

/**
 * Checks the subscription status of a project's owner.
 *
 * Retrieves the project using the provided projectId, then fetches the owner's ID from the project data.
 * Calls checkUserSubscription to determine the subscription status of the project owner.
 *
 * @param {string} projectId - The unique identifier of the project.
 * @return {Promise<SubscriptionPlan>} - Promise resolving to the SubscriptionPlan of the project owner.
 * @throws {HttpsError} - Throws error with ErrorCode.ProjectNotFound if the project does not exist.
 *                        Throws error with ErrorCode.DatabaseError if the owner ID is missing.
 */
export async function checkProjectOwnerSubscription(projectId: string): Promise<SubscriptionPlan> {
  const db = admin.firestore();
  const projectRef = db.collection("projects").doc(projectId);
  const doc = await projectRef.get();

  if (!doc.exists) {
    throw new HttpsError("not-found", ErrorCode.ProjectNotFound);
  }

  const projectData = doc.data();
  const ownerId = projectData?.owner;
  if (!ownerId) {
    throw new HttpsError("not-found", ErrorCode.DatabaseError);
  }

  return await checkUserSubscription(ownerId);
}

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
