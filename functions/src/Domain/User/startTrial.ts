import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserData} from "../../Common/getUserData";
import {SubscriptionPlan} from "../../Model/subscriptionPlan";
import {SubscriptionStatus} from "../../Model/subscriptionStatus";

export const startTrial = onCall(async (request) => {
  logger.info("onCall startTrial", request.data);

  const db = admin.firestore();
  const userId = verifyAuthentication(request).uid;
  const userRef = db.collection("users").doc(userId);
  const userData = await getUserData(userId);

  const subscriptionValidUntil = new Date();
  subscriptionValidUntil.setDate(subscriptionValidUntil.getDate() + 7);

  try {
    if (!userData.subscriptionPlan && !userData.subscriptionValidUntil && !userData.subscriptionStatus) {
      userRef.update({
        "subscriptionPlan": SubscriptionPlan.team,
        "subscriptionValidUntil": subscriptionValidUntil,
        "subscriptionStatus": SubscriptionStatus.trial,
      });
    }
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
