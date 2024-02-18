import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import * as deepl from "deepl-node";
import * as logger from "firebase-functions/logger";
import {Language} from "../../Model/language";
import {KeyStatus} from "../../Model/keyStatus";
import {db} from "../../Common/firebaseConfiguration";

export const onKeyCreate = onDocumentCreated("projects/{projectId}/keys/{keyId}", async (event) => {
  logger.info("onCall onKeyCreate", event);
  const projectId = event.params.projectId;
  const keyId = event.params.keyId;
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

  for (const language of languagesToTranslate) {
    const sourceLanguage = baseLanguage.split("-")[0] as deepl.SourceLanguageCode;
    const targetLanguage = language as deepl.TargetLanguageCode;
    const result = await translator.translateText(textToTranslation, sourceLanguage, targetLanguage);
    const translationField = "translation." + language;
    const statusField = "status." + language;
    const deeplResult = result as deepl.TextResult;
    await keyRef.update({
      [translationField]: deeplResult.text,
      [statusField]: KeyStatus.review,
    });
  }
  return;
});
