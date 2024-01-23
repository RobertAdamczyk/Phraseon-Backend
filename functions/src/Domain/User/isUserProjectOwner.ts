import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {ErrorCode} from "../../Model/errorCode";

export const isUserProjectOwner = onCall(async (request) => {
  logger.info("onCall isUserProjectOwner", request.data);

  const userId = verifyAuthentication(request).uid;
  const documentsRef = admin.firestore().collection("projects").where("owner", "==", userId);

  try {
    const documents = await documentsRef.get();
    return {isOwner: !documents.empty};
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
