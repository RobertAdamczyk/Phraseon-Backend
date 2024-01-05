import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {SubscriptionStatus} from "../../Model/subscriptionStatus";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info("onUserCreate", user);

  const subscriptionValidUntil = new Date();
  subscriptionValidUntil.setDate(subscriptionValidUntil.getDate() + 7);

  const newDoc = {
    "email": user.email,
    "createdAt": admin.firestore.FieldValue.serverTimestamp(),
    "subscriptionValidUntil": subscriptionValidUntil,
    "name": "",
    "surname": "",
    "subscriptionStatus": SubscriptionStatus.trial,
  };

  const documentRef = admin.firestore().collection("users").doc(user.uid);
  await documentRef.set(newDoc);
  return {message: "Document created successfully."};
});
