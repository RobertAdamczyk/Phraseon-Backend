import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {verifyKeyId} from "../../Common/verifyKeyId";
import {verifyLanguage} from "../../Common/verifyLanguage";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerTeamSubscriptionPlanIfNecessary, checkUserSubscription} from "../../Common/checkSubscription";
import {verifyPhraseContentLength} from "../../Common/verifyPhraseContentLength";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const changeContentKey = onCall(async (request) => {
  logger.info("onCall changeContentKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;
  const language = request.data.language;

  verifyPhraseContentLength(translation);
  verifyKeyId(keyId);
  verifyLanguage(language);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.changeContentKey);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerTeamSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  const documentRef = db.collection("projects").doc(projectId).collection("keys").doc(keyId);

  try {
    await documentRef.update({
      ["translation." + language]: translation,
      "lastUpdatedAt": FieldValue.serverTimestamp(),
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});

