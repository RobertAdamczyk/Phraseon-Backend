import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";

export const setBaseLanguage = onCall(async (request) => {
  logger.info("onCall setBaseLanguage", request.data);

  const db = admin.firestore();
  const projectId = request.data.projectId;
  const baseLanguage = request.data.baseLanguage;
  const projectRef = db.collection("projects").doc(projectId);

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.setBaseLanguage);

  try {
    await projectRef.update({"baseLanguage": baseLanguage});
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
