import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import * as deepl from "deepl-node";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Language} from "../../Model/Language";

export const onKeyCreate = onDocumentCreated("projects/{projectId}/keys/{keyId}", async (event) => {
  logger.info("onCall onKeyCreate", event);
  const projectId = event.params.projectId;
  const keyId = event.params.keyId;
  const db = admin.firestore();
  const projectRef = db.collection("projects").doc(projectId);
  const keyRef = projectRef.collection("keys").doc(keyId);

  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();

  const projectDoc = await projectRef.get();
  const projectData = projectDoc.data();

  if (projectData === undefined || projectData === null) {
    throw new HttpsError("not-found", "Data not found.");
  }

  const baseLanguage = projectData.baseLanguage;
  const textToTranslation = data.translation[baseLanguage];
  // Base language is already translated
  const languagesToTranslate = projectData.languages.filter((language: Language) => language !== baseLanguage);
  const deepLApiKey = process.env.PLANET;

  if (deepLApiKey === undefined || deepLApiKey === null) {
    return;
  }

  const translator = new deepl.Translator(deepLApiKey);

  try {
    for (const language of languagesToTranslate) {
      const result = await translator.translateText(textToTranslation, null, language as deepl.TargetLanguageCode);
      const field = "translation." + language;
      const deeplResult = result as deepl.TextResult;
      await keyRef.update({[field]: deeplResult.text});
    }
  } catch (error) {
    throw new HttpsError("unknown", "An error occurred while processing your request.", error);
  }
  return;
});
