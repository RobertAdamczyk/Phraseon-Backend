/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

enum KeyStatus {
  approved = 0,
  review = 1,
}

enum SubscriptionStatus {
  trial = "TRIAL",
  basic = "BASIC",
  gold = "GOLD",
}

export const isUserProjectOwner = onCall(async (request) => {
  logger.info("onCall isUserProjectOwner", request.data);
  const userId = request.data.userId;

  const documentsRef = admin.firestore().collection("projects").where("owner", "==", userId);

  try {
    const documents = await documentsRef.get();
    if (!documents.empty) {
      return {isOwner: true};
    } else {
      return {isOwner: false};
    }
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

export const createKey = onCall(async (request) => {
  logger.info("onCall createKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;

  if (!keyId) {
    throw new HttpsError("invalid-argument", "Invalid key ID.");
  }

  const documentRef = admin.firestore().collection("projects").doc(projectId).collection("keys").doc(keyId);

  const newDoc = {
    "translation": translation,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "lastUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    "status": KeyStatus.review,
  };

  try {
    const doc = await documentRef.get();
    if (doc.exists) {
      throw new HttpsError("already-exists", "Phrase with the provided key ID already exists.");
    } else {
      await documentRef.set(newDoc);
      return {message: "Document created successfully."};
    }
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info("onUserCreate", user);

  const subscriptionValidUntil = new Date();
  subscriptionValidUntil.setDate(subscriptionValidUntil.getDate() + 7);

  const newDoc = {
    "email": user.email,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "subscriptionValidUntil": subscriptionValidUntil,
    "name": "",
    "surname": "",
    "subscriptionStatus": SubscriptionStatus.trial,
  };

  const documentRef = admin.firestore().collection("users").doc(user.uid);
  try {
    await documentRef.set(newDoc);
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  logger.info("onUserDelete", user);

  // Removing the user's document within Firestore
  const documentRef = admin.firestore().collection("users").doc(user.uid);
  await documentRef.delete();

  // Removing the user's ID from 'members' array in all projects within Firestore
  const projectsRef = admin.firestore().collection("projects");
  const snapshot = await projectsRef.where("members", "array-contains", user.uid).get();

  if (!snapshot.empty) {
    const batch = admin.firestore().batch();
    snapshot.forEach(async (projectDoc) => {
      // Update the main document
      const newMembers = projectDoc.data().members.filter((id: string) => id !== user.uid);
      batch.update(projectDoc.ref, {members: newMembers});

      // Delete the user's document from the nested 'members' collection
      const memberDocRef = projectDoc.ref.collection("members").doc(user.uid);
      batch.delete(memberDocRef);
    });
    await batch.commit();
  }

  // Deleting the user's profile picture from Firebase Storage
  const profilePicPath = "user/" + user.uid + "/image.jpg";
  await admin.storage().bucket().file(profilePicPath).delete();
});
