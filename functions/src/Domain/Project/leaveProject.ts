import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const leaveProject = onCall(async (request) => {
  logger.info("onCall leaveProject", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const userId = request.auth.uid;
  const projectId = request.data.projectId;

  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  if (projectDoc.data()?.owner === userId ) {
    throw new HttpsError("failed-precondition", "You can't leave the project as the current owner.");
  }

  const memberRef = projectRef.collection("members").doc(userId);

  const batch = db.batch();
  batch.update(projectRef, {
    members: admin.firestore.FieldValue.arrayRemove(userId),
  });
  batch.delete(memberRef);

  try {
    await batch.commit();
    return {message: "Project left successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});
