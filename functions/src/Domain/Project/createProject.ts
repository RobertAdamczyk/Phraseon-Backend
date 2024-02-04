import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Project} from "../../Model/project";
import {Member} from "../../Model/member";
import {Role} from "../../Model/role";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserData} from "../../Common/getUserData";
import {verifyLanguage, verifyLanguages} from "../../Common/verifyLanguage";
import {checkUserSubscription} from "../../Common/checkSubscription";
import {SubscriptionPlan} from "../../Model/subscriptionPlan";

export const createProject = onCall(async (request) => {
  logger.info("onCall createProject", request.data);

  const db = admin.firestore();
  const languages = request.data.languages;
  const baseLanguage = request.data.baseLanguage;

  verifyLanguages(languages);
  verifyLanguage(baseLanguage);
  const userId = verifyAuthentication(request).uid;
  const userData = await getUserData(userId);
  const subscriptionPlan = await checkUserSubscription(userId);
  const userProjects = await db.collection("projects").where("owner", "==", userId).get(); // check projects count
  if (subscriptionPlan != SubscriptionPlan.current.team && userProjects.docs.length >= 5) {
    throw new HttpsError("not-found", ErrorCode.ProjectCreationLimit);
  }

  const batch = db.batch();

  const projectRef = db.collection("projects").doc();
  const project: Project = {
    name: request.data.name,
    technologies: request.data.technologies,
    languages: languages,
    baseLanguage: baseLanguage,
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

