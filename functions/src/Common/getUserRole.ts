import {Role} from "../Model/role";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebaseConfiguration";

/**
 * Retrieves the role of a user in a specific project. It queries the Firestore database
 * to find the user's role in the project based on the provided project and user IDs.
 *
 * @param {string} projectId - The ID of the project.
 * @param {string} userId - The ID of the user whose role is to be retrieved.
 * @return {Promise<Role>} A promise that resolves to the role of the user in the project.
 * @throws {HttpsError} Throws a error with ErrorCode.MemberNotFound if the user is not a member of the project.
 * @throws {HttpsError} Throws a error with ErrorCode.RoleNotFound if the role of the user is not found or undefined.
 */
export async function getUserRole(projectId: string, userId: string): Promise<Role> {
  const memberRef = db.collection("projects").doc(projectId).collection("members").doc(userId);
  const doc = await memberRef.get();

  if (!doc.exists) {
    throw new HttpsError("not-found", ErrorCode.MemberNotFound);
  }

  const role = doc.data()?.role as Role;
  if (!role) {
    throw new HttpsError("not-found", ErrorCode.RoleNotFound);
  }

  return role;
}
