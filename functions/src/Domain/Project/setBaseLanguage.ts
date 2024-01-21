import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Role} from "../../Model/role";

export const setBaseLanguage = onCall(async (request) => {
  logger.info("onCall setBaseLanguage", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const userId = request.auth.uid;
  const projectId = request.data.projectId;
  const baseLanguage = request.data.baseLanguage;
  const projectRef = db.collection("projects").doc(projectId);

  const currentMemberRef = projectRef.collection("members").doc(userId);
  const currentMemberDoc = await currentMemberRef.get();

  if (!currentMemberDoc.exists) {
    throw new HttpsError("not-found", "Current member not found.");
  }

  const allowedRoles = [Role.admin, Role.owner];
  const userRole = currentMemberDoc.data()?.role;
  if (!allowedRoles.includes(userRole)) {
    throw new HttpsError("failed-precondition", "You can't set the base language of project.");
  }

  try {
    await projectRef.update({"baseLanguage": baseLanguage});
    return {message: "Base language changed successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});