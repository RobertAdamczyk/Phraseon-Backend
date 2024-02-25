import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {ErrorCode} from "../../Model/errorCode";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserData} from "../../Common/getUserData";
import {SubscriptionPlan} from "../../Model/subscriptionPlan";
import {SubscriptionStatus} from "../../Model/subscriptionStatus";
import {db} from "../../Common/firebaseConfiguration";

export const startTrial = onCall(async (request) => {
  logger.info("onCall startTrial", request.data);

  const userId = verifyAuthentication(request).uid;
  const userRef = db.collection("users").doc(userId);
  const userData = await getUserData(userId);

  const subscriptionValidUntil = new Date();
  subscriptionValidUntil.setDate(subscriptionValidUntil.getDate() + 7);

  try {
    if (!userData.subscriptionPlan && !userData.subscriptionValidUntil && !userData.subscriptionStatus) {
      userRef.update({
        "subscriptionPlan": SubscriptionPlan.current.monthly,
        "subscriptionValidUntil": subscriptionValidUntil,
        "subscriptionStatus": SubscriptionStatus.trial,
      });
    }
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
