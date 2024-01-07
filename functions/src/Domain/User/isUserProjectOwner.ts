import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const isUserProjectOwner = onCall(async (request) => {
  logger.info("onCall isUserProjectOwner", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const userId = request.auth.uid;
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
