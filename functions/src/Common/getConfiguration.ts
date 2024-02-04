import {HttpsError} from "firebase-functions/v2/https";
import {ErrorCode} from "../Model/errorCode";
import {Environment} from "@apple/app-store-server-library";

/**
 * Retrieves the ProjectConfiguration based on the Firebase project ID.
 *
 * This function dynamically determines the ProjectConfiguration by comparing the current Firebase
 * project ID against known project IDs for 'inhouse' and 'live' environments.
 *
 * @return {ProjectConfiguration} The ProjectConfiguration corresponding to the current Firebase project.
 * @throws {HttpsError} Throws an error if the project ID does not match any known environments.
 */
export function getConfiguration(): ProjectConfiguration {
  const projectId = process.env.GCLOUD_PROJECT;

  if (projectId === ProjectId.inhouse) {
    const environment: ProjectConfiguration = {
      bundleId: BundleId.inhouse,
      bucketName: BucketName.inhouse,
      environment: Environment.SANDBOX,
      build: Build.inhouse,
    };
    return environment;
  } else if (projectId === ProjectId.live) {
    const environment: ProjectConfiguration = {
      bundleId: BundleId.live,
      bucketName: BucketName.live,
      environment: Environment.PRODUCTION,
      build: Build.live,
    };
    return environment;
  }
  throw new HttpsError("unknown", ErrorCode.DatabaseError);
}

interface ProjectConfiguration {
    bundleId: string;
    bucketName: string;
    environment: Environment;
    build: Build;
}

enum Build {
  inhouse = "inhouse",
  live = "live",
}

enum BundleId {
  inhouse = "robert.adamczyk.phraseon.inhouse",
  live = "robert.adamczyk.phraseon.live",
}

enum BucketName {
  inhouse = "phraseon-inhouse.appspot.com",
  live = "phraseon-live.appspot.com",
}

enum ProjectId {
  inhouse = "phraseon-inhouse",
  live = "phraseon-live",
}
