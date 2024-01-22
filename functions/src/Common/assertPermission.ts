import {Role} from "../Model/role";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

export enum Action {
  approveTranslation = "approveTranslation",
  changeContentKey = "changeContentKey",
  createKey = "createKey",
  deleteKey = "deleteKey",
}

type RolePermissions = {
  [role in Role]: Action[];
};

const rolePermissions: RolePermissions = {
  [Role.owner]: [Action.approveTranslation, Action.changeContentKey, Action.createKey, Action.deleteKey],
  [Role.admin]: [Action.approveTranslation, Action.changeContentKey, Action.createKey, Action.deleteKey],
  [Role.developer]: [Action.changeContentKey, Action.createKey, Action.deleteKey],
  [Role.marketing]: [Action.approveTranslation, Action.changeContentKey],
  [Role.viewer]: [],
};

/**
 * Asserts whether a user with a given role has permission to perform a specific action.
 * Throws an HttpsError with "permission-denied" if the user does not have the required permission.
 *
 * @param {Role} role - The role of the user. It should be one of the enumerated `Role` values.
 * @param {Action} action - The action to be performed. It should be one of the enumerated `Action` values.
 * @throws {HttpsError} Throws a "permission-denied" error if the user does not have permission to perform the action.
 */
export function assertPermission(role: Role, action: Action): void {
  if (!rolePermissions[role].includes(action)) {
    throw new HttpsError("permission-denied", ErrorCode.PermissionDenied);
  }
}
