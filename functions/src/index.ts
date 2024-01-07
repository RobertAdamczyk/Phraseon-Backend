/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
export * from "./Domain/User/isUserProjectOwner";
export * from "./Domain/User/onUserCreate";
export * from "./Domain/User/onUserDelete";
export * from "./Domain/User/onUserDataUpdate";
export * from "./Domain/Keys/createKey";
export * from "./Domain/Project/createProject";

admin.initializeApp();
admin.firestore().settings({ignoreUndefinedProperties: true});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
