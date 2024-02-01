import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {KeyStatus} from "../../Model/keyStatus";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {assertPermission, Action} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {verifyLanguage} from "../../Common/verifyLanguage";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerTeamSubscriptionPlanIfNecessary, checkUserSubscription} from "../../Common/checkSubscription";

export const approveTranslation = onCall(async (request) => {
  logger.info("onCall approveTranslation", request.data);
  const projectId = request.data.projectId;
  const keyId = request.data.keyId;
  const language = request.data.language;
  const db = admin.firestore();

  const userId = verifyAuthentication(request).uid;
  verifyLanguage(language);

  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.approveTranslation);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerTeamSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  const documentRef = db.collection("projects").doc(projectId).collection("keys").doc(keyId);

  try {
    await documentRef.update({
      ["status." + language]: KeyStatus.approved,
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
