import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

/**
 * Verifies the validity of a given key ID.
 *
 * This function checks if the provided `keyId` is a non-empty string.
 * If the `keyId` is null, undefined, or an empty string, the function throws an HttpsError
 * with the error code for an invalid key ID.
 *
 * @param {string} keyId - The key ID to be verified.
 * @throws {HttpsError} Throws an 'invalid-argument' HttpsError with ErrorCode.InvalidKeyID
 *                      if the key ID is invalid (null, undefined, or empty).
 */
export function verifyKeyId(keyId: string) {
  if (!keyId) {
    throw new HttpsError("invalid-argument", ErrorCode.InvalidKeyID);
  }
}
