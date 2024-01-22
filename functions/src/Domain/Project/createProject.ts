import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Project} from "../../Model/project";
import {Member} from "../../Model/member";
import {Role} from "../../Model/role";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserData} from "../../Common/getUserData";

export const createProject = onCall(async (request) => {
  logger.info("onCall createProject", request.data);

  const db = admin.firestore();

  const userId = verifyAuthentication(request).uid;
  const userData = await getUserData(userId);

  const batch = db.batch();

  const projectRef = db.collection("projects").doc();
  const project: Project = {
    name: request.data.name,
    technologies: request.data.technologies,
    languages: request.data.languages,
    baseLanguage: request.data.baseLanguage,
    members: [userId],
    owner: userId,
  };

  batch.set(projectRef, project);

  const memberRef = projectRef.collection("members").doc(userId);
  const member: Member = {
    role: Role.owner,
    name: userData.name,
    surname: userData.surname,
    email: userData.email,
    photoUrl: userData.photoUrl,
  };

  batch.set(memberRef, member);

  try {
    await batch.commit();
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});

