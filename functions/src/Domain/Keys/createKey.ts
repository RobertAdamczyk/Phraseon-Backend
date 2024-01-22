import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {KeyStatus} from "../../Model/keyStatus";
import {verifyKeyId} from "../../Common/verifyKeyId";
import {getUserRole} from "../../Common/getUserRole";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {verifyLanguage} from "../../Common/verifyLanguage";

export const createKey = onCall(async (request) => {
  logger.info("onCall createKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;
  const language = request.data.language;

  verifyLanguage(language);
  verifyKeyId(keyId);
  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.createKey);

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
      throw new HttpsError("already-exists", ErrorCode.KeyAlreadyExists);
    } else {
      await documentRef.set(newDoc);
      return;
    }
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
