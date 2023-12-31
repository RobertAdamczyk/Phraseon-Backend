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

  const newDoc = {
    "email": user.email,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "name": "",
    "surname": "",
  };

  const documentRef = admin.firestore().collection("users").doc(user.uid);
  try {
    await documentRef.set(newDoc);
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});
