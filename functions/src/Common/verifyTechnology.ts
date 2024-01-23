import {HttpsError} from "firebase-functions/v2/https";
import {Technology} from "../Model/technology";
import {ErrorCode} from "../Model/errorCode";

/**
 * Validates if each technology code in the provided array is a valid enum member of Technology.
 *
 * @param {string[]} technologies - The array of technology codes provided by the client.
 */
export function verifyTechnologies(technologies: string[]) {
  if (!technologies.every((tech) => Object.values(Technology).includes(tech as Technology))) {
    throw new HttpsError("invalid-argument", ErrorCode.TechnologyNotValid);
  }
}

/**
 * Validates if the provided technology code is a valid enum member of Technology.
 *
 * @param {string} technology - The technology code provided by the client.
 */
export function verifyTechnology(technology: string) {
  if (!Object.values(Technology).includes(technology as Technology)) {
    throw new HttpsError("invalid-argument", ErrorCode.TechnologyNotValid);
  }
}
