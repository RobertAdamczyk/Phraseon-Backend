import {HttpsError} from "firebase-functions/v2/https";
import {ErrorCode} from "../Model/errorCode";
import {Environment} from "@apple/app-store-server-library";

/**
 * Retrieves the ProjectEnvironment based on the Firebase project ID.
 *
 * This function dynamically determines theProjectEnvironment by comparing the current Firebase
 * project ID against known project IDs for 'inhouse' and 'live' environments.
 *
 * @return {ProjectEnvironment} The ProjectEnvironment corresponding to the current Firebase project.
 * @throws {HttpsError} Throws an error if the project ID does not match any known environments.
 */
export function getEnvironment(): ProjectEnvironment {
  const inhouseProjectId = "phrasify-inhouse";
  const liveProjectId = "phrasify-live";

  const projectId = process.env.GCLOUD_PROJECT;

  if (projectId === inhouseProjectId) {
    const environment: ProjectEnvironment = {
      bundleId: "robert.adamczyk.phrasify.inhouse",
      bucketName: "phrasify-inhouse.appspot.com",
      environment: Environment.SANDBOX,
    };
    return environment;
  } else if (projectId === liveProjectId) {
    const environment: ProjectEnvironment = {
      bundleId: "robert.adamczyk.phrasify.live",
      bucketName: "phrasify-live.appspot.com",
      environment: Environment.PRODUCTION,
    };
    return environment;
  }
  throw new HttpsError("unknown", ErrorCode.DatabaseError);
}

interface ProjectEnvironment {
    bundleId: string;
    bucketName: string;
    environment: Environment;
}
