import {
  getApps,
  getApp,
  initializeApp,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp() as App;
  }
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (privateKey && projectId && clientEmail) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: storageBucket ?? undefined,
    });
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      const serviceAccount = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: storageBucket ?? parsed.project_id ? `${parsed.project_id}.appspot.com` : undefined,
      });
    } catch {
      // fall through to applicationDefault
    }
  }
  return initializeApp({
    credential: applicationDefault(),
    storageBucket: storageBucket ?? undefined,
  });
}

const adminApp = getFirebaseAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
