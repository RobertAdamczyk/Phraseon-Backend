import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

export const onProjectLanguagesUpdate = onDocumentUpdated("projects/{projectId}", async (event) => {
  logger.info("onCall onProjectLanguagesUpdate", event.data?.after.data());
  const newValue = event.data?.after.data();
  const oldvalue = event.data?.before.data();
  const projectId = event.params.projectId;

  // Sprawdzanie, czy pole 'languages' zostało zmienione
  if (JSON.stringify(oldvalue?.languages) !== JSON.stringify(newValue?.languages)) {
    console.log("Languages changed in project " + projectId);
    const beforeLanguages = oldvalue?.languages || [];
    const afterLanguages = newValue?.languages || [];

    // Tutaj możesz wykonać dodatkowe operacje związane ze zmianą języków
    // Na przykład: porównaj listy języków, wywołaj inne funkcje, zaktualizuj inne dokumenty itp.

    // Przykład logowania zmian
    console.log("Removed languages:", beforeLanguages.filter((lang: string) => !afterLanguages.includes(lang)));
    console.log("Added languages:", afterLanguages.filter((lang: string) => !beforeLanguages.includes(lang)));

    // Pamiętaj o obsłudze błędów i asynchronicznych operacjach
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
