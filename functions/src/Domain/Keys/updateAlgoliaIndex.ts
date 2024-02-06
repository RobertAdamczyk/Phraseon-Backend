import * as functions from "firebase-functions";
import algoliasearch from "algoliasearch";

export const updateAlgoliaIndex = functions.firestore
  .document("projects/{projectId}/keys/{keyId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;

    const appId = process.env.ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;

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
      ...document,
    };

    if (document) {
      await algoliaIndex.saveObject(algoliaObject);
    } else {
      await algoliaIndex.deleteObject(context.params.keyId);
    }
  });
