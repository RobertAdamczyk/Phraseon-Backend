import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const deleteMember = onCall(async (request) => {
  logger.info("onCall deleteMember", request.data);

  const userIdToDelete = request.data.userId;
  const projectId = request.data.projectId;

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.deleteMember);

  const projectRef = db.collection("projects").doc(projectId);

  if (userId == userIdToDelete) {
    throw new HttpsError("failed-precondition", ErrorCode.CannotDeleteSelf);
  }

  const memberToDeleteRef = projectRef.collection("members").doc(userIdToDelete);

  const batch = db.batch();
  batch.update(projectRef, {
    members: FieldValue.arrayRemove(userIdToDelete),
  });
  batch.delete(memberToDeleteRef);

  try {
    await batch.commit();
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});

