import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import {db, storage} from "../../Common/firebaseConfiguration";

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  logger.info("onUserDelete", user);

  // Removing the user's document within Firestore
  const documentRef = db.collection("users").doc(user.uid);
  await documentRef.delete();

  // Removing the user's ID from 'members' array in all projects within Firestore
  const projectsRef = db.collection("projects");
  const snapshot = await projectsRef.where("members", "array-contains", user.uid).get();

  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.forEach(async (projectDoc) => {
    // Update the main document
      const newMembers = projectDoc.data().members.filter((id: string) => id !== user.uid);
      batch.update(projectDoc.ref, {members: newMembers});

      // Delete the user's document from the nested 'members' collection
      const memberDocRef = projectDoc.ref.collection("members").doc(user.uid);
      batch.delete(memberDocRef);
    });
    await batch.commit();
  }

  // Deleting the user's profile picture from Firebase Storage
  const profilePicPath = "user/" + user.uid + "/image.jpg";
  await storage.bucket().file(profilePicPath).delete();
});
