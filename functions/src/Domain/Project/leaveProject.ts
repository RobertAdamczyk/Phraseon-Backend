import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const leaveProject = onCall(async (request) => {
  logger.info("onCall leaveProject", request.data);

  const projectId = request.data.projectId;

  const projectRef = db.collection("projects").doc(projectId);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.leaveProject);

  const memberRef = projectRef.collection("members").doc(userId);

  const batch = db.batch();
  batch.update(projectRef, {
    members: FieldValue.arrayRemove(userId),
  });
  batch.delete(memberRef);

  try {
    await batch.commit();
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
