import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {Storage} from "@google-cloud/storage";
import * as os from "os";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import {Environment, NotificationTypeV2, SignedDataVerifier, Subtype} from "@apple/app-store-server-library";
import {SubscriptionStatus} from "../../Model/subscriptionStatus";
import {getConfiguration} from "../../Common/getConfiguration";

/**
 * Handles subscription change notifications in the Production environment.
 * Initializes a verifier with production parameters and processes the notification.
 *
 * @param {Request} request The request object from the HTTP trigger.
 * @param {Response} response The response object to send back the HTTP response.
 */
export const notifySubscriptionChangeProduction = onRequest(async (request, response) => {
  logger.info("Start of notifySubscriptionChange in Production environment");
  const projectEnvironment = getConfiguration();
  const appleRootCAs: Buffer[] = await loadAppleRootCAs();
  const verifier = new SignedDataVerifier(appleRootCAs, true, Environment.PRODUCTION, projectEnvironment.bundleId);

  await processNotification(verifier, request.body.signedPayload);
  response.status(200).send("OK");
});

/**
 * Handles subscription change notifications in the Sandbox environment.
 * Initializes a verifier with sandbox parameters and processes the notification.
 *
 * @param {Request} request The request object from the HTTP trigger.
 * @param {Response} response The response object to send back the HTTP response.
 */
export const notifySubscriptionChangeSandbox = onRequest(async (request, response) => {
  logger.info("Start of notifySubscriptionChange in Sandbox environment");
  const projectEnvironment = getConfiguration();
  const appleRootCAs: Buffer[] = await loadAppleRootCAs();
  const verifier = new SignedDataVerifier(appleRootCAs, true, Environment.SANDBOX, projectEnvironment.bundleId);

  await processNotification(verifier, request.body.signedPayload);
  response.status(200).send("OK");
});

/**
 * Processes the verified notification payload to update the user's subscription status in Firestore.
 *
 * @param {SignedDataVerifier} verifier The verifier instance to decode and verify the notification.
 * @param {string} signedPayload The signed payload from the request body to be verified and processed.
 */
async function processNotification(verifier: SignedDataVerifier, signedPayload: string) {
  const db = admin.firestore();
  const verifiedNotification = await verifier.verifyAndDecodeNotification(signedPayload);
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
}

/**
 * Loads the specified Apple Root CA certificates from Google Cloud Storage.
 * @return {Promise<Buffer[]>} A promise that resolves to an array of Buffers, each containing a certificate.
 */
async function loadAppleRootCAs(): Promise<Buffer[]> {
  const storage = new Storage();
  const projectEnvironment = getConfiguration();
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
      await storage.bucket(projectEnvironment.bucketName).file("Certificates/" + certificateName).download({
        destination: tempFilePath,
      });

      // Reads the certificate file content
      return fs.promises.readFile(tempFilePath);
    }),
  );
}
