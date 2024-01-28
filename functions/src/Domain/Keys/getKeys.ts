import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {isUserProjectMember} from "../../Common/isUserProjectMember";
import {ErrorCode} from "../../Model/errorCode";

export const getKeys = onRequest(async (request, response) => {
  logger.info("onRequest getKeys", request);
  const db = admin.firestore();

  const projectId = request.query.projectId as string;
  const userAccessKey = request.headers["x-access-key"] as string; // userId

  if (!projectId) {
    response.status(400).send(ErrorCode.ProjectNotFound);
    return;
  }

  if (!userAccessKey) {
    response.status(403).send(ErrorCode.PermissionDenied);
    return;
  }

  try {
    const projectRef = db.collection("projects").doc(projectId);

    const isProjectMember = await isUserProjectMember(projectId, userAccessKey);
    if (!isProjectMember) {
      response.status(403).send(ErrorCode.PermissionDenied);
      return;
    }

    const keysRef = projectRef.collection("keys");
    const keysSnapshot = await keysRef.get();
    const transformedKeys: {[key: string]: {[language: string]: string}} = {};

    keysSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const keyName = doc.id;
      transformedKeys[keyName] = {};

      // Adding translations to the corresponding key object
      Object.entries(data.translation || {}).forEach(([languageCode, text]) => {
        // Translating the language code to the desired format if necessary
        // For example, converting "EN-US" to "EN", "PT-PT" to "PT", etc.
        const simplifiedLanguageCode = languageCode.split("-")[0]; // Removes regional suffix
        transformedKeys[keyName][simplifiedLanguageCode] = text as string;
      });
    });
    response.status(200).send(transformedKeys);
  } catch (error) {
    console.error("Error:", error);
    response.status(500).send(ErrorCode.DatabaseError);
  }
});
