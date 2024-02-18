import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {Member} from "../../Model/member";
import {ErrorCode} from "../../Model/errorCode";
import {isUserProjectMember} from "../../Common/isUserProjectMember";
import {verifyRole} from "../../Common/verifyRole";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {getUserData} from "../../Common/getUserData";
import {getProjectOwnerId} from "../../Common/getProjectOwnerId";
import {checkProjectOwnerTeamSubscriptionPlan, checkUserSubscription} from "../../Common/checkSubscription";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const addProjectMember = onCall(async (request) => {
  logger.info("onCall addProjectMember", request.data);

  const userIdToAdd = request.data.userId;
  const projectId = request.data.projectId;

  const projectRef = db.collection("projects").doc(projectId);
  const memberRef = projectRef.collection("members").doc(userIdToAdd);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.addProjectMember);

  const projectOwnerId = await getProjectOwnerId(projectId);
  const projectOwnerSubscriptionPlan = await checkUserSubscription(projectOwnerId);
  checkProjectOwnerTeamSubscriptionPlan(projectOwnerSubscriptionPlan);

  if (await isUserProjectMember(projectId, userIdToAdd)) {
    throw new HttpsError("already-exists", ErrorCode.AlreadyMember);
  }

  verifyRole(request.data.role);

  const userData = await getUserData(userIdToAdd);

  const member: Member = {
    role: request.data.role,
    name: userData.name,
    surname: userData.surname,
    email: userData.email,
    photoUrl: userData.photoUrl,
  };

  const batch = db.batch();

  batch.update(projectRef, {
    members: FieldValue.arrayUnion(userIdToAdd),
  });
  batch.set(memberRef, member);

  try {
    await batch.commit();
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});

