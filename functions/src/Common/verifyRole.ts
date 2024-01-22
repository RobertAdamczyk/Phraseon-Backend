import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";
import {Role} from "../Model/role";

/**
 * Verifies if the provided role is one of the accepted roles.
 *
 * This function checks if the given `role` is within the predefined set of roles:
 * admin, developer, marketing, and viewer. The `role` is expected to be of the
 * `Role` enum type. If the role is not one of the accepted values, the function
 * throws an HttpsError indicating a 'failed-precondition'.
 *
 * @param {Role} role - The role to be verified.
 * @throws {HttpsError} - Throws a 'failed-precondition' HttpsError with ErrorCode.RoleNotFound
 *                        if the provided role is not among the accepted roles.
 */
export function verifyRole(role: Role) {
  if (![Role.admin, Role.developer, Role.marketing, Role.viewer].includes(role)) {
    throw new HttpsError("failed-precondition", ErrorCode.RoleNotFound);
  }
}
