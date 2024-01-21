import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {KeyStatus} from "../../Model/keyStatus";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {assertPermission, Action} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";

export const approveTranslation = onCall(async (request) => {
  logger.info("onCall approveTranslation", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const language = request.data.language;
  const db = admin.firestore();

  const userId = verifyAuthentication(request).uid;

  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.approveTranslation);

  const documentRef = db.collection("projects").doc(projectId).collection("keys").doc(keyId);

  try {
    await documentRef.set({
      "status": {[language]: KeyStatus.approved},
    }, {merge: true});
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError, error);
  }
});

