import {AuthData, CallableRequest} from "firebase-functions/lib/common/providers/https";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

/**
 * Verifies if a request is authenticated. This function checks if the request object
 * contains authentication data and throws an error if it is not authenticated.
 *
 * @param {any} request - The request object, expected to contain an 'auth' property.
 * @return {AuthData} The authentication data from the request if it is authenticated.
 * @throws {HttpsError} Throws a "unauthenticated" error with ErrorCode.UserUnauthenticated
 *                      if the request does not contain valid authentication data.
 */
export function verifyAuthentication(request: CallableRequest): AuthData {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", ErrorCode.UserUnauthenticated);
  }
  return request.auth;
}
