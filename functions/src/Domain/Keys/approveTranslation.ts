import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Role} from "../../Model/role";
import {KeyStatus} from "../../Model/keyStatus";

export const approveTranslation = onCall(async (request) => {
  logger.info("onCall approveTranslation", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const language = request.data.language;
  const db = admin.firestore();

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const userId = request.auth.uid;

  const projectRef = db.collection("projects").doc(projectId);
  const currentMemberRef = projectRef.collection("members").doc(userId);
  const currentMemberDoc = await currentMemberRef.get();

  const allowedRoles = [Role.admin, Role.owner, Role.marketing];
  const userRole = currentMemberDoc.data()?.role;
  if (!allowedRoles.includes(userRole)) {
    throw new HttpsError("failed-precondition", "Missing permission.");
  }

  const documentRef = projectRef.collection("keys").doc(keyId);

  try {
    await documentRef.update({
      "status": {[language]: KeyStatus.approved},
    });
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

