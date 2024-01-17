import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {KeyStatus} from "../../Model/keyStatus";

export const createKey = onCall(async (request) => {
  logger.info("onCall createKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;
  const language = request.data.language;

  if (!keyId) {
    throw new HttpsError("invalid-argument", "Invalid key ID.");
  }

  const documentRef = admin.firestore().collection("projects").doc(projectId).collection("keys").doc(keyId);

  const newDoc = {
    "translation": {[language]: translation},
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "lastUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    "status": {[language]: KeyStatus.review},
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
