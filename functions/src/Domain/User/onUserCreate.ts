import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info("onUserCreate", user);

  const subscriptionValidUntil = new Date();
  subscriptionValidUntil.setDate(subscriptionValidUntil.getDate() + 7);

  const newDoc = {
    "email": user.email,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "name": "",
    "surname": "",
  };

  const documentRef = admin.firestore().collection("users").doc(user.uid);
  await documentRef.set(newDoc);
  return {message: "Document created successfully."};
});
