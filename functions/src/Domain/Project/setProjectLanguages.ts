import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {verifyAuthentication} from "../../Common/verifyAuthentication";
import {getUserRole} from "../../Common/getUserRole";
import {Action, assertPermission} from "../../Common/assertPermission";
import {ErrorCode} from "../../Model/errorCode";

export const setProjectLanguages = onCall(async (request) => {
  logger.info("onCall setProjectLanguages", request.data);

  const db = admin.firestore();
  const projectId = request.data.projectId;
  const languages = request.data.languages;

  const userId = verifyAuthentication(request).uid;
  const role = await getUserRole(projectId, userId);
  assertPermission(role, Action.setProjectLanguages);

  const projectRef = db.collection("projects").doc(projectId);

  try {
    await projectRef.update({
      "languages": languages,
    });
    return;
  } catch (error) {
    throw new HttpsError("unknown", ErrorCode.DatabaseError);
  }
});
