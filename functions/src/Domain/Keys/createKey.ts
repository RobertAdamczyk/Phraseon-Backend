import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {KeyStatus} from "../../Model/keyStatus";
import {verifyKeyId} from "../../Common/verifyKeyId";
import {getUserRole} from "../../Common/getUserRole";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {verifyLanguage} from "../../Common/verifyLanguage";
import {checkUserSubscription, checkProjectOwnerTeamSubscriptionPlanIfNecessary} from "../../Common/checkSubscription";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {verifyPhraseContentLength} from "../../Common/verifyPhraseContentLength";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const createKey = onCall(async (request) => {
  logger.info("onCall createKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;
  const language = request.data.language;

  verifyPhraseContentLength(translation);
  verifyLanguage(language);
  verifyKeyId(keyId);
  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.createKey);
  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerTeamSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  const documentRef = db.collection("projects").doc(projectId).collection("keys").doc(keyId);

  const newDoc = {
    "translation": {[language]: translation},
    "createdAt": FieldValue.serverTimestamp(),
    "lastUpdatedAt": FieldValue.serverTimestamp(),
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
