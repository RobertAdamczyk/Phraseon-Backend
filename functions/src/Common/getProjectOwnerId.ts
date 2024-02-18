import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {getProjectData} from "./getProjectData";

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
  const projectData = await getProjectData(projectId);
  const ownerId = projectData.owner;
  if (!ownerId) {
    throw new HttpsError("not-found", ErrorCode.DatabaseError);
  }

  return ownerId;
}
