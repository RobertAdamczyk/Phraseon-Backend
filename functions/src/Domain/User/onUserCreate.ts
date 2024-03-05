import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import {v4 as uuidv4} from "uuid";
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../Common/firebaseConfiguration";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info("onUserCreate", user);

  const subscriptionId = uuidv4();

  const newDoc = {
    "email": user.email,
    "createdAt": FieldValue.serverTimestamp(),
    "subscriptionId": subscriptionId,
  };

  const documentRef = db.collection("users").doc(user.uid);
  await documentRef.set(newDoc, {merge: true});
  return {message: "Document created successfully."};
});
