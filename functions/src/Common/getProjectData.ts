import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebaseConfiguration";
import {DocumentData} from "firebase-admin/firestore";

/**
 * Retrieves the project data for a given project ID from Firestore.
 *
 * This asynchronous function looks up a project by the specified `projectId` in the 'projects'
 * collection of Firestore. If the project exists, it returns their data. If the project
 * does not exist, or if the `projectId` does not correspond to a valid project, it throws
 * an HttpsError with an error code indicating that the project was not found.
 *
 * @param {string} projectId - The unique identifier for the project whose data is to be retrieved.
 * @return {Promise<admin.firestore.DocumentData>} - A promise that resolves to the project's data document.
 * @throws {HttpsError} - Throws a HttpsError ProjectNotFound if no project data is found for the given `projectId`.
 */
export async function getProjectData(projectId: string): Promise<DocumentData> {
  const projectDoc = await db.collection("projects").doc(projectId).get();

  if (!projectDoc.exists) {
    throw new HttpsError("not-found", ErrorCode.ProjectNotFound);
  }

  const projectData = projectDoc.data();

  if (!projectData) {
    throw new HttpsError("not-found", ErrorCode.ProjectNotFound);
  }
  return projectData;
}
