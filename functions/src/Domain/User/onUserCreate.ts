import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {v4 as uuidv4} from "uuid";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info("onUserCreate", user);

  const subscriptionId = uuidv4();

  const newDoc = {
    "email": user.email,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "name": "",
    "surname": "",
    "subscriptionId": subscriptionId,
  };

  const documentRef = admin.firestore().collection("users").doc(user.uid);
  await documentRef.set(newDoc);
  return {message: "Document created successfully."};
});
