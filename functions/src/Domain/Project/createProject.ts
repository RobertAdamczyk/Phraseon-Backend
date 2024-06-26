import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {Project} from "../../Model/project";
import {Member} from "../../Model/member";
import {Role} from "../../Model/role";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserData} from "../../Common/getUserData";
import {verifyLanguage, verifyLanguages} from "../../Common/verifyLanguage";
import {checkUserSubscription} from "../../Common/checkSubscription";
import {verifyTechnologies} from "../../Common/verifyTechnology";
import {generateSecuredApiKey} from "../../Common/algoliaClient";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const createProject = onCall(async (request) => {
  logger.info("onCall createProject", request.data);

  const languages = request.data.languages;
  const technologies = request.data.technologies;
  const baseLanguage = request.data.baseLanguage;

  verifyLanguages(languages);
  verifyLanguage(baseLanguage);
  verifyTechnologies(technologies);
  const userId = verifyAuthentication(request).uid;
  const userData = await getUserData(userId);
  await checkUserSubscription(userId);

  const batch = db.batch();
  const projectRef = db.collection("projects").doc();

  const securedAlgoliaApiKey = generateSecuredApiKey(projectRef.id);

  const project: Project = {
    name: request.data.name,
    technologies: technologies,
    languages: languages,
    baseLanguage: baseLanguage,
    members: [userId],
    owner: userId,
    securedAlgoliaApiKey: securedAlgoliaApiKey,
    createdAt: FieldValue.serverTimestamp(),
    algoliaIndexName: "GLOBAL_PROJECTS_KEYS",
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
