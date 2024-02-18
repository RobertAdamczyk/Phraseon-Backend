import * as functions from "firebase-functions";
import {initAlgoliaIndex} from "../../Common/algoliaClient";
import {getProjectData} from "../../Common/getProjectData";

export const updateAlgoliaIndex = functions.firestore
  .document("projects/{projectId}/keys/{keyId}")
  .onWrite(async (change, context) => {
    const projectId = context.params.projectId;

    const projectData = await getProjectData(projectId);
    const algoliaIndex = initAlgoliaIndex(projectData.algoliaIndexName);

    const document = change.after.exists ? change.after.data() : null;

    const algoliaObject = {
      objectID: projectId + "_" + context.params.keyId,
      keyId: context.params.keyId,
      projectId: projectId,
      ...document,
    };

    if (document) {
      await algoliaIndex.saveObject(algoliaObject);
    } else {
      await algoliaIndex.deleteObject(context.params.keyId);
    }
  });
