import * as admin from "firebase-admin";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

/**
 * Retrieves the owner ID of a specified project.
 *
 * This function fetches the project data using the provided projectId and then extracts the owner's ID from it.
 *
 * @param {string} projectId - The unique identifier of the project.
 * @return {Promise<string>} - Promise resolving to the owner ID of the project.
 * @throws {HttpsError} - Throws error with ErrorCode.ProjectNotFound if the project does not exist.
 *                        Throws error with ErrorCode.DatabaseError if the owner ID is missing in the project data.
 */
export async function getProjectOwnerId(projectId: string): Promise<string> {
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

  return ownerId;
}
