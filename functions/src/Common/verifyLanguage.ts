import {HttpsError} from "firebase-functions/v2/https";
import {Language} from "../Model/Language";
import {ErrorCode} from "../Model/errorCode";

/**
 * Validates if each language code in the provided array is a valid enum member of Language.
 *
 * @param {string[]} languages - The array of language codes provided by the client.
 */
export function verifyLanguages(languages: string[]) {
  if (languages.every(code => Object.values(Language).includes(code as Language))) {
    throw new HttpsError("invalid-argument", ErrorCode.InvalidKeyID);
  }
}

  /**
 * Validates if the provided language code is a valid enum member of Language.
 *
 * @param {string} language - The language code provided by the client.
 */
export function verifyLanguage(language: string) {
  if (Object.values(Language).includes(language as Language)) {
    throw new HttpsError("invalid-argument", ErrorCode.InvalidKeyID);
  }
}