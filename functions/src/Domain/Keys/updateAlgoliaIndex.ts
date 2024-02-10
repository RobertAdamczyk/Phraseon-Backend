import * as functions from "firebase-functions";
import algoliasearch from "algoliasearch";
import {getConfiguration} from "../../Common/getConfiguration";

export const updateAlgoliaIndex = functions.firestore
  .document("projects/{projectId}/keys/{keyId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;

    const configuration = getConfiguration();
    const appId = configuration.algoliaAppId;
    const adminKey = configuration.algoliaAdminKey;

    if (appId === undefined || appId === null) {
      return;
    }

    if (adminKey === undefined || adminKey === null) {
      return;
    }

    const algoliaClient = algoliasearch(appId, adminKey);

    const algoliaIndexName = projectId;
    const algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

    const document = change.after.exists ? change.after.data() : null;

    const algoliaObject = {
      objectID: context.params.keyId,
      keyId: context.params.keyId,
      ...document,
    };

    if (document) {
      await algoliaIndex.saveObject(algoliaObject);
    } else {
      await algoliaIndex.deleteObject(context.params.keyId);
    }
  });
