import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Role} from "../../Model/role";

export const setProjectTechnologies = onCall(async (request) => {
  logger.info("onCall setProjectTechnologies", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const userId = request.auth.uid;
  const projectId = request.data.projectId;
  const technologies = request.data.technologies;

  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  const currentMemberRef = projectRef.collection("members").doc(userId);
  const currentMemberDoc = await currentMemberRef.get();

  if (!currentMemberDoc.exists) {
    throw new HttpsError("not-found", "Current member not found.");
  }

  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  if (currentMemberDoc.data()?.role !== Role.admin && currentMemberDoc.data()?.role !== Role.owner) {
    throw new HttpsError("failed-precondition", "You can't change the languages of project.");
  }

  try {
    await projectRef.update({
      "technologies": technologies,
    });
    return {message: "Changed technologies successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});
