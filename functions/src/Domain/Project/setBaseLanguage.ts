import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerTeamSubscriptionPlanIfNecessary, checkUserSubscription} from "../../Common/checkSubscription";
import {verifyLanguage} from "../../Common/verifyLanguage";
import {db} from "../../Common/firebaseConfiguration";

export const setBaseLanguage = onCall(async (request) => {
  logger.info("onCall setBaseLanguage", request.data);

  const projectId = request.data.projectId;
  const baseLanguage = request.data.baseLanguage;
  const projectRef = db.collection("projects").doc(projectId);

  verifyLanguage(baseLanguage);
  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.setBaseLanguage);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerTeamSubscriptionPlanIfNecessary(userId, projectOwnerId, projectOwnerSubscriptionPlan);

  try {
    await projectRef.update({"baseLanguage": baseLanguage});
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
