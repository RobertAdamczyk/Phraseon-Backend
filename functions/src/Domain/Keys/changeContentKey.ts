import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const changeContentKey = onCall(async (request) => {
  logger.info("onCall changeContentKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;

  if (!keyId) {
    throw new HttpsError("invalid-argument", "Invalid key ID.");
  }

  const documentRef = admin.firestore().collection("projects").doc(projectId).collection("keys").doc(keyId);

  try {
    await documentRef.set({
      "translation": translation,
      "lastUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

