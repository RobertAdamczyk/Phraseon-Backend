import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {ErrorCode} from "../../Model/errorCode";
import {db} from "../../Common/firebaseConfiguration";

export const isUserProjectOwner = onCall(async (request) => {
  logger.info("onCall isUserProjectOwner", request.data);

  const userId = verifyAuthentication(request).uid;
  const documentsRef = db.collection("projects").where("owner", "==", userId);

  try {
    const documents = await documentsRef.get();
    return {isOwner: !documents.empty};
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
