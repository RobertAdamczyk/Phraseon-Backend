import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Project} from "../../Model/project";
import {Member} from "../../Model/member";
import {Role} from "../../Model/role";

export const createProject = onCall(async (request) => {
  logger.info("onCall createProject", request.data);

  const db = admin.firestore();

  const userId = request.auth?.uid;
  if (userId === undefined || userId === null) {
    throw new HttpsError("unauthenticated", "An error occurred while processing your request.");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data() || {};

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
    return {message: "Document created successfully."};
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
});

