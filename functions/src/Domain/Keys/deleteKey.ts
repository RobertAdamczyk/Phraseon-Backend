import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkUserSubscription} from "../../Common/checkSubscription";
import {db} from "../../Common/firebaseConfiguration";

export const deleteKey = onCall(async (request) => {
  logger.info("onCall deleteKey", request.data);
  const keyIdToDelete = request.data.keyId;
  const projectId = request.data.projectId;
  const projectRef = db.collection("projects").doc(projectId);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.deleteKey);

  const projectOwnerId = await getProjectOwnerId(projectId);
  await checkUserSubscription(projectOwnerId);

  const keyRefToDelete = projectRef.collection("keys").doc(keyIdToDelete);

  try {
    await keyRefToDelete.delete();
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
