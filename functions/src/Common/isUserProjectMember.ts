import {getProjectData} from "./getProjectData";

/**
 * Checks if a user is a member of a specific project.
 *
 * This asynchronous function verifies whether a given user (identified by `userId`)
 * is a member of a specified project (identified by `projectId`). It queries the
 * 'projects' collection in Firestore to retrieve the project data and then checks
 * if the user's ID is included in the project's members list.
 *
 * @param {string} projectId - The unique identifier for the project.
 * @param {string} userId - The unique identifier for the user.
 * @return {Promise<boolean>} - A promise that resolves to `true` if the user is a member
 *                               of the project, or `false` otherwise.
 * @throws {HttpsError} - Throws a 'not-found' HttpsError with ErrorCode.ProjectNotFound
 *                        if the project data does not exist.
 */
export async function isUserProjectMember(projectId: string, userId: string): Promise<boolean> {
  const projectData = await getProjectData(projectId);
  return projectData.members.includes(userId);
}
