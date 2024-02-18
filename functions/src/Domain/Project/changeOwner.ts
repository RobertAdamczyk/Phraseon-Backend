import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {Role} from "../../Model/role";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {isUserProjectMember} from "../../Common/isUserProjectMember";
import {db} from "../../Common/firebaseConfiguration";

export const changeOwner = onCall(async (request) => {
  logger.info("onCall changeOwner", request.data);

  const newOwnerEmail = request.data.newOwnerEmail;
  const projectId = request.data.projectId;

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.changeOwner);

  // Retrieve new owner's information based on their email
  const usersRef = db.collection("users");
  const querySnapshot = await usersRef.where("email", "==", newOwnerEmail).get();

  if (querySnapshot.empty) {
    throw new HttpsError("not-found", ErrorCode.UserNotFound);
  }

  const newOwnerDoc = querySnapshot.docs[0];
  const newOwnerId = newOwnerDoc.id;

  const projectRef = db.collection("projects").doc(projectId);
  const memberRef = projectRef.collection("members").doc(newOwnerId);

  if (!await isUserProjectMember(projectId, newOwnerId)) {
    throw new HttpsError("not-found", ErrorCode.MemberNotFound);
  }

  // Update fields
  const batch = db.batch();
  batch.update(projectRef, {owner: newOwnerId});
  batch.update(projectRef.collection("members").doc(userId), {role: Role.admin});
  batch.update(memberRef, {role: Role.owner});
  await batch.commit();

  return;
});
