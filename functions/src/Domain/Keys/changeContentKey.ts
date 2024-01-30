import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {verifyKeyId} from "../../Common/verifyKeyId";
import {verifyLanguage} from "../../Common/verifyLanguage";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerGoldSubscriptionPlanIfNecessary, checkUserSubscription} from "../../Common/checkSubscription";

export const changeContentKey = onCall(async (request) => {
  logger.info("onCall changeContentKey", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const translation = request.data.translation;
  const language = request.data.language;
  const db = admin.firestore();

  verifyKeyId(keyId);
  verifyLanguage(language);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.changeContentKey);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerGoldSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  const documentRef = db.collection("projects").doc(projectId).collection("keys").doc(keyId);

  try {
    await documentRef.update({
      ["translation." + language]: translation,
      "lastUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});

