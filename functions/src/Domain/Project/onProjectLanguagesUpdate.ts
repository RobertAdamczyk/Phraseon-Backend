import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as deepl from "deepl-node";
import {KeyStatus} from "../../Model/keyStatus";
import {db} from "../../Common/firebaseConfiguration";
import {FieldValue} from "firebase-admin/firestore";

export const onProjectLanguagesUpdate = onDocumentUpdated("projects/{projectId}", async (event) => {
  logger.info("onCall onProjectLanguagesUpdate", event.data?.after.data());
  const newValue = event.data?.after.data();
  const oldvalue = event.data?.before.data();
  const projectId = event.params.projectId;

  if (JSON.stringify(oldvalue?.languages) !== JSON.stringify(newValue?.languages)) {
    console.log("Languages changed in project " + projectId);
    const beforeLanguages = oldvalue?.languages || [];
    const afterLanguages = newValue?.languages || [];

    const removedLanguages = beforeLanguages.filter((lang: string) => !afterLanguages.includes(lang));
    const addedLanguages = afterLanguages.filter((lang: string) => !beforeLanguages.includes(lang));
    console.log("Removed languages:", removedLanguages);
    console.log("Added languages:", addedLanguages);

    const keysRef = db.collection("projects").doc(projectId).collection("keys");
    const snapshot = await keysRef.get();

    if (removedLanguages.length > 0) {
      for (const key of snapshot.docs) {
        const keyRef = keysRef.doc(key.id);
        for (const lang of removedLanguages) {
          const fieldName = "translation." + lang;
          await keyRef.update({
            [fieldName]: FieldValue.delete(),
          });
        }
      }
    }

    if (addedLanguages.length > 0) {
      const deepLApiKey = process.env.PLANET;
      if (deepLApiKey === undefined || deepLApiKey === null) {
        return;
      }
      const translator = new deepl.Translator(deepLApiKey);

      for (const key of snapshot.docs) {
        const keyRef = keysRef.doc(key.id);
        for (const lang of addedLanguages) {
          const textToTranslate: string = key.data().translation[newValue?.baseLanguage];
          const sourceLanguage = newValue?.baseLanguage.split("-")[0] as deepl.SourceLanguageCode;
          const targetLanguage = lang as deepl.TargetLanguageCode;
          const result = await translator.translateText(textToTranslate, sourceLanguage, targetLanguage);
          const deeplResult = result as deepl.TextResult;
          const translationField = "translation." + lang;
          const statusField = "status." + lang;
          await keyRef.update({
            [translationField]: deeplResult.text,
            [statusField]: KeyStatus.review,
          });
        }
      }
    }
  } else {
    console.log("Languages did not change");
  }
});
