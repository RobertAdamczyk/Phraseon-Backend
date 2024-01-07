import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Member} from "../../Model/member";

export const addProjectMember = onCall(async (request) => {
  logger.info("onCall addProjectMember", request.data);

  const db = admin.firestore();
  const userId = request.data.userId;

  const projectRef = db.collection("projects").doc(request.data.projectId);
  const memberRef = projectRef.collection("members").doc(userId);

  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  if (projectDoc.data()?.members.includes(userId)) {
    throw new HttpsError("already-exists", "The user is already a member of the project.");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() || {};

  const member: Member = {
    role: request.data.role,
    name: userData.name,
    surname: userData.surname,
    email: userData.email,
    photoUrl: userData.photoUrl,
  };

  const batch = db.batch();

  batch.update(projectRef, {
    members: admin.firestore.FieldValue.arrayUnion(userId),
  });
  batch.set(memberRef, member);

  try {
    await batch.commit();
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

