import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
db.settings({ignoreUndefinedProperties: true});

const storage = admin.storage();

export {db, storage};
