import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {verifyRole} from "../../Common/verifyRole";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerGoldSubscriptionPlan, checkUserSubscription} from "../../Common/checkSubscription";

export const changeMemberRole = onCall(async (request) => {
  logger.info("onCall changeMemberRole", request.data);

  const db = admin.firestore();
  const userIdToChange = request.data.userId;
  const projectId = request.data.projectId;

  const projectRef = db.collection("projects").doc(projectId);
  const memberRef = projectRef.collection("members").doc(userIdToChange);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.changeMemberRole);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerGoldSubscriptionPlan(projectOwnerSubscriptionPlan);

  verifyRole(request.data.role);

  try {
    await memberRef.update({"role": request.data.role});
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
