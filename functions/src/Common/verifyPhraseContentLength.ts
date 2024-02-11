import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

/**
 * Validates the length of a given phrase to ensure it does not exceed a maximum length.
 * If the phrase exceeds the maximum allowed length, the function throws an HttpsError with details.
 *
 * @param {string} phrase - The phrase to be validated.
 * @throws {HttpsError} - Throws an "invalid-argument" error if the phrase exceeds the maximum length.
 *                        The error includes a custom ErrorCode and details object containing the maxLength.
 */
export function verifyPhraseContentLength(phrase: string) {
  const MAX_LENGTH = 1000;
  if (phrase.length > MAX_LENGTH) {
    throw new HttpsError("invalid-argument", ErrorCode.PhraseContentTooLong, {maxLength: MAX_LENGTH});
  }
}
