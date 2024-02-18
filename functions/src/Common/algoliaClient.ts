import algoliasearch, {SearchIndex} from "algoliasearch";
import {getConfiguration} from "./getConfiguration";
import {ErrorCode} from "../Model/errorCode";
import {HttpsError} from "firebase-functions/v2/https";

const initializeAlgoliaClient = () => {
  const configuration = getConfiguration();
  const appId = configuration.algoliaAppId;
  const adminKey = configuration.algoliaAdminKey;

  if (!appId || !adminKey) {
    throw new HttpsError("internal", ErrorCode.AlgoliaConfigurationMissing);
  }

  const algoliaClient = algoliasearch(appId, adminKey);

  if (!algoliaClient) {
    throw new HttpsError("internal", ErrorCode.AlgoliaConfigurationMissing);
  }

  return algoliaClient;
};

/**
 * Generates a secured Algolia API key based on the given project ID.
 *
 * This function creates a secured API key that restricts access to the data in the
 * Algolia index to only those associated with the specified project. This is achieved
 * by adding a filter to the API key.
 *
 * @param {string} projectId The identifier of the project for which the secured API key is generated.
 * @return {string} A string representing the secured Algolia API key.
 * @throws HttpsError - When the Algolia search key is not available in the configuration.
 */
export function generateSecuredApiKey(projectId: string): string {
  const configuration = getConfiguration();
  const algoliaClient = initializeAlgoliaClient();
  const searchKey = configuration.algoliaSearchKey;

  if (!searchKey) {
    throw new HttpsError("internal", ErrorCode.AlgoliaConfigurationMissing);
  }

  const securedAlgoliaApiKey = algoliaClient.generateSecuredApiKey(
    searchKey, {filters: "projectId:" + projectId}
  );

  return securedAlgoliaApiKey;
}

/**
 * Initializes and configures the main Algolia index for the application.
 *
 * This function initializes an Algolia index named "main" and configures it
 * by setting the appropriate attributes for faceting. This allows for later
 * filtering of search results based on project-specific criteria.
 *
 * @param {string} indexName The name of the index where keys are stored.
 * @return {SearchIndex} The Algolia index object that has been initialized and configured.
 */
export function initAlgoliaIndex(indexName: string): SearchIndex {
  const algoliaClient = initializeAlgoliaClient();

  const algoliaIndex = algoliaClient.initIndex(indexName);
  algoliaIndex.setSettings({
    attributesForFaceting: [
      "filterOnly(projectId)",
    ],
    searchableAttributes: [
      "keyId,translation",
    ],
  });

  return algoliaIndex;
}
