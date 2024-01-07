import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const onUserDataUpdate = onDocumentUpdated("users/{userId}", async (event) => {
  const newValue = event.data?.after.data();
  const oldvalue = event.data?.before.data();
  const userId = event.params.userId;

  const newName = newValue?.name;
  const newSurname = newValue?.surname;
  const newPhotoUrl = newValue?.photoUrl;

  if (newName === oldvalue?.name && newSurname === oldvalue?.surname && newPhotoUrl === oldvalue?.photoUrl) {
    logger.info("No changes in user data, skipping update.", newValue);
    return null;
  }
  // Removing the user's ID from 'members' array in all projects within Firestore
  const projectsRef = admin.firestore().collection("projects");
  const snapshot = await projectsRef.where("members", "array-contains", userId).get();

  if (!snapshot.empty) {
    const batch = admin.firestore().batch();
    snapshot.forEach(async (projectDoc) => {
      // Delete the user's document from the nested 'members' collection
      const memberDocRef = projectDoc.ref.collection("members").doc(userId);
      const updatedData = {
        "name": newName,
        "surname": newSurname,
        "photoUrl": newPhotoUrl,
      };
      batch.update(memberDocRef, updatedData);
    });
    await batch.commit();
  }
  return null;
});
