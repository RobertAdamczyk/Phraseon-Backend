import {HttpsError} from "firebase-functions/v2/https";
import {ErrorCode} from "../Model/errorCode";

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
      build: Build.inhouse,
      algoliaAppId: process.env.ALGOLIA_APP_ID_INHOUSE,
      algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY_INHOUSE,
      algoliaSearchKey: process.env.ALGOLIA_SEARCH_KEY_INHOUSE,
      appleAppId: undefined,
    };
    return environment;
  } else if (projectId === ProjectId.live) {
    const environment: ProjectConfiguration = {
      bundleId: BundleId.live,
      bucketName: BucketName.live,
      build: Build.live,
      algoliaAppId: process.env.ALGOLIA_APP_ID_LIVE,
      algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY_LIVE,
      algoliaSearchKey: process.env.ALGOLIA_SEARCH_KEY_LIVE,
      appleAppId: process.env.APPLE_APP_ID,
    };
    return environment;
  }
  throw new HttpsError("unknown", ErrorCode.DatabaseError);
}

interface ProjectConfiguration {
    bundleId: string;
    bucketName: string;
    build: Build;
    algoliaAppId: string | undefined;
    algoliaAdminKey: string | undefined,
    algoliaSearchKey: string | undefined,
    appleAppId: string | undefined,
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
