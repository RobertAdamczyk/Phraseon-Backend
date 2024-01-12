import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as deepl from "deepl-node";

export const onProjectLanguagesUpdate = onDocumentUpdated("projects/{projectId}", async (event) => {
  logger.info("onCall onProjectLanguagesUpdate", event.data?.after.data());
  const newValue = event.data?.after.data();
  const oldvalue = event.data?.before.data();
  const projectId = event.params.projectId;
  const db = admin.firestore();

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
            [fieldName]: admin.firestore.FieldValue.delete(),
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
          const result = await translator.translateText(textToTranslate, null, lang as deepl.TargetLanguageCode);
          const deeplResult = result as deepl.TextResult;
          const fieldName = "translation." + lang;
          await keyRef.update({
            [fieldName]: deeplResult.text,
          });
        }
      }
    }
  } else {
    console.log("Languages did not change");
  }
});

// export const setProjectLanguages = onCall(async (request) => {
//     logger.info("onCall setProjectLanguages", request.data);

//     const db = admin.firestore();
//     const projectId = request.data.projectId;
//     const languages = request.data.languages;
//     const userId = request.auth?.uid;

//     if (userId === undefined || userId === null) {
//       throw new HttpsError("unauthenticated", "An error occurred while processing your request.");
//     }

//     const projectRef = db.collection("projects").doc(projectId);
//     const projectDoc = await projectRef.get();

//     if (!projectDoc.exists) {
//       throw new HttpsError("not-found", "Project not found.");
//     }

//     const currentLanguages = projectDoc.data()?.languages;

//     if (currentLanguages === undefined || currentLanguages === null) {
//       throw new HttpsError("not-found", "Data not found.");
//     }

//     const languagesToAdd = languages.filter(lang => !currentLanguages.includes(lang));
//     const languagesToRemove = currentLanguages.filter(lang => !languages.includes(lang));

//     const snapshot = await projectRef.collection("keys").get()
//     const batch = db.batch();

//     snapshot.forEach((key) => {
//       const keyRef = projectRef.collection("keys").doc(key.id);
//       languagesToRemove.forEach((lang) => {
//           const fieldName = "translation." + lang;
//           batch.update(keyRef, ({
//               fieldName: admin.firestore.FieldValue.delete(),
//           }));
//       });

//     });

//     batch.update(projectRef, ({
//       "languages": languages,
//     }));

//     try {
//       await batch.commit();
//       return {message: "Successfully."};
//     } catch (error) {
//       throw new HttpsError("unknown", "An error occurred while processing your request.", error);
//     }
//   });
