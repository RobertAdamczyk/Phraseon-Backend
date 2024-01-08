import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Role} from "../../Model/role";

export const changeMemberRole = onCall(async (request) => {
  logger.info("onCall changeMemberRole", request.data);

  const db = admin.firestore();
  const userId = request.data.userId;

  const projectRef = db.collection("projects").doc(request.data.projectId);
  const memberRef = projectRef.collection("members").doc(userId);

  if (request.data.role === Role.owner) {
    throw new HttpsError("failed-precondition", "You can't add a second project owner.");
  }

  try {
    await memberRef.update({"role": request.data.role});
    return {message: "Role updated successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});
