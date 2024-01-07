import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Role} from "../../Model/role";

export const changeOwner = onCall(async (request) => {
  logger.info("onCall changeOwner", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const currentUserId = request.auth.uid;
  const newOwnerEmail = request.data.newOwnerEmail;
  const projectId = request.data.projectId;

  // Retrieve new owner's information based on their email
  const usersRef = db.collection("users");
  const querySnapshot = await usersRef.where("email", "==", newOwnerEmail).get();

  if (querySnapshot.empty) {
    throw new HttpsError("not-found", "New owner user not found.");
  }

  const newOwnerDoc = querySnapshot.docs[0];
  const newOwnerId = newOwnerDoc.id;

  // Retrieve the project document
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found.");
  }

  // Check if the current user is the owner of the project
  if (projectDoc.data()?.owner !== currentUserId) {
    throw new HttpsError("permission-denied", "Only the project owner can change the owner.");
  }

  // Check if the new owner is already a member of the project
  const memberRef = projectRef.collection("members").doc(newOwnerId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    throw new HttpsError("not-found", "New owner is not a member of the project.");
  }

  // Update fields
  const batch = db.batch();
  batch.update(projectRef, {owner: newOwnerId});
  batch.update(projectRef.collection("members").doc(currentUserId), {role: Role.admin});
  batch.update(memberRef, {role: Role.owner});
  await batch.commit();

  return {message: "Project owner has been successfully changed."};
});
