import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkUserSubscription} from "../../Common/checkSubscription";
import {verifyLanguages} from "../../Common/verifyLanguage";
import {db} from "../../Common/firebaseConfiguration";

export const setProjectLanguages = onCall(async (request) => {
  logger.info("onCall setProjectLanguages", request.data);

  const projectId = request.data.projectId;
  const languages = request.data.languages;

  verifyLanguages(languages);
  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.setProjectLanguages);

  const projectOwnerId = await getProjectOwnerId(projectId);
  await checkUserSubscription(projectOwnerId);

  const projectRef = db.collection("projects").doc(projectId);

  try {
    await projectRef.update({
      "languages": languages,
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
