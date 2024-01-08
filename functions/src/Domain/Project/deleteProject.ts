import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const deleteProject = onCall(async (request) => {
  logger.info("onCall deleteProject", request.data);

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const userId = request.auth.uid;
  const projectId = request.data.projectId;

  const projectRef = db.collection("projects").doc(projectId);
  const keysRef = projectRef.collection("keys");
  const membersRef = projectRef.collection("members");
  const deletedProjectsRef = db.collection("deleted_projects");

  try {
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError("not-found", "Project not found.");
    }

    if (projectDoc.data()?.owner !== userId) {
      throw new HttpsError("permission-denied", "Only the project owner can delete the project.");
    }

    const projectData = projectDoc.data();
    const deletedProjectRef = deletedProjectsRef.doc(projectId);

    // Get all keys from project
    const keysSnapshot = await keysRef.get();
    const keysData = keysSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

    // Get all members from project
    const membersSnapshot = await membersRef.get();
    const membersData = membersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

    await db.runTransaction(async (transaction) => {
      // Add project to 'deleted_projects'
      transaction.set(deletedProjectRef, projectData);

      // Add each key to subcollection 'keys' in 'deleted_projects'
      keysData.forEach((key) => {
        const keyRef = deletedProjectRef.collection("keys").doc(key.id);
        transaction.set(keyRef, key);
      });

      // Add each member to subcollection 'members' in 'deleted_projects'
      membersData.forEach((member) => {
        const memberRef = deletedProjectRef.collection("members").doc(member.id);
        transaction.set(memberRef, member);
      });

      // Delete project and subcollection 'keys' and 'members'
      transaction.delete(projectRef);
      keysSnapshot.docs.forEach((doc) => transaction.delete(doc.ref));
      membersSnapshot.docs.forEach((doc) => transaction.delete(doc.ref));
    });
    return {message: "Project and its keys and members moved to deleted projects."};
  } catch (error) {
    throw new HttpsError("internal", "Unable to delete the project.", error);
  }
});
