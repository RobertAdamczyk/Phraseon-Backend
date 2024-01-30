import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerGoldSubscriptionPlanIfNecessary, checkUserSubscription} from "../../Common/checkSubscription";

export const setProjectTechnologies = onCall(async (request) => {
  logger.info("onCall setProjectTechnologies", request.data);

  const db = admin.firestore();
  const projectId = request.data.projectId;
  const technologies = request.data.technologies;

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.setProjectTechnologies);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerGoldSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  const projectRef = db.collection("projects").doc(projectId);

  try {
    await projectRef.update({
      "technologies": technologies,
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
