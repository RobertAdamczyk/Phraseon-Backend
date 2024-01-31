import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {Storage} from "@google-cloud/storage";
import * as os from "os";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import {Environment, NotificationTypeV2, SignedDataVerifier, Subtype} from "@apple/app-store-server-library";
import {SubscriptionStatus} from "../../Model/subscriptionStatus";

export const notifySubscriptionChange = onRequest(async (request, response) => {
  logger.info("Start of notifySubscriptionChange");

  const bundleId = "robert.adamczyk.phrasify.inhouse";
  const appleRootCAs: Buffer[] = await loadAppleRootCAs();
  const enableOnlineChecks = true;
  const environment = Environment.SANDBOX;
  const verifier = new SignedDataVerifier(appleRootCAs, enableOnlineChecks, environment, bundleId);
  const db = admin.firestore();

  const notificationPayload = request.body.signedPayload;

  const verifiedNotification = await verifier.verifyAndDecodeNotification(notificationPayload);
  logger.info("verifiedNotification", verifiedNotification);
  if (verifiedNotification?.data?.signedTransactionInfo) {
    const signedTransactionInfo = await verifier.verifyAndDecodeTransaction(
      verifiedNotification.data.signedTransactionInfo
    );
    logger.info("signedTransactionInfo", signedTransactionInfo);
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where("subscriptionId", "==", signedTransactionInfo.appAccountToken).get();
    if (!querySnapshot.empty) {
      const user = querySnapshot.docs[0];
      const userRef = usersRef.doc(user.id);
      let subscriptionValidUntil: Date | null | undefined;
      if (signedTransactionInfo.expiresDate !== undefined) {
        subscriptionValidUntil = new Date(signedTransactionInfo.expiresDate);
      } else {
        subscriptionValidUntil = null;
      }
      let subscriptionStatus: SubscriptionStatus;
      if (verifiedNotification.subtype == Subtype.AUTO_RENEW_DISABLED ||
        verifiedNotification.notificationType == NotificationTypeV2.EXPIRED ||
        verifiedNotification.notificationType == NotificationTypeV2.DID_FAIL_TO_RENEW ||
        verifiedNotification.notificationType == NotificationTypeV2.GRACE_PERIOD_EXPIRED) {
        subscriptionStatus = SubscriptionStatus.expires;
      } else {
        subscriptionStatus = SubscriptionStatus.renews;
      }
      await userRef.update({
        "subscriptionStatus": subscriptionStatus,
        "subscriptionPlan": signedTransactionInfo.productId,
        "subscriptionValidUntil": subscriptionValidUntil,
      });
    } else {
      logger.info("No user found.");
    }
  }
  response.status(200).send("OK");
});

/**
 * Loads the specified Apple Root CA certificates from Google Cloud Storage.
 * @return {Promise<Buffer[]>} A promise that resolves to an array of Buffers, each containing a certificate.
 */
async function loadAppleRootCAs(): Promise<Buffer[]> {
  const storage = new Storage();
  const bucketName = "phrasify-inhouse.appspot.com";
  const certificateNames = [
    "AppleIncRootCertificate.cer",
    "AppleComputerRootCertificate.cer",
    "AppleRootCA-G2.cer",
    "AppleRootCA-G3.cer",
  ];

  return Promise.all(
    certificateNames.map(async (certificateName) => {
      const tempFilePath = path.join(os.tmpdir(), certificateName);

      // Downloads the certificate file
      await storage.bucket(bucketName).file("Certificates/" + certificateName).download({
        destination: tempFilePath,
      });

      // Reads the certificate file content
      return fs.promises.readFile(tempFilePath);
    }),
  );
}
