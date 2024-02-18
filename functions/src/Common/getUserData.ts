import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebaseConfiguration";
import {DocumentData} from "firebase-admin/firestore";

/**
 * Retrieves the user data for a given user ID from Firestore.
 *
 * This asynchronous function looks up a user by the specified `userId` in the 'users'
 * collection of Firestore. If the user exists, it returns their data. If the user
 * does not exist, or if the `userId` does not correspond to a valid user, it throws
 * an HttpsError with an error code indicating that the user was not found.
 *
 * @param {string} userId - The unique identifier for the user whose data is to be retrieved.
 * @return {Promise<admin.firestore.DocumentData>} - A promise that resolves to the user's data document.
 * @throws {HttpsError} - Throws a HttpsError UserNotFound if no user data is found for the given `userId`.
 */
export async function getUserData(userId: string): Promise<DocumentData> {
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    throw new HttpsError("not-found", ErrorCode.UserNotFound);
  }
  return userData;
}
