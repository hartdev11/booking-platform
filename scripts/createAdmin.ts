import "./loadEnv";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  getApps,
  getApp,
  initializeApp,
  cert,
  applicationDefault,
} from "firebase-admin/app";

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (privateKey && projectId && clientEmail) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      const serviceAccount = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch {
      //
    }
  }
  return initializeApp({
    credential: applicationDefault(),
  });
}

const app = getFirebaseAdminApp();
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

const ADMIN_EMAIL = "admin@jongme.com";
const ADMIN_PASSWORD = "Admin1234!";

async function main() {
  const lineChannelAccessToken =
    process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";
  const lineChannelSecret = process.env.LINE_CHANNEL_SECRET ?? "";

  const user = await adminAuth.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    emailVerified: true,
  });
  console.log("Created Firebase Auth user:", user.uid);

  const now = Timestamp.now();
  const tenantRef = adminDb.collection("tenants").doc();
  const tenantId = tenantRef.id;

  await tenantRef.set({
    name: "JongMe",
    businessType: "salon",
    adminEmail: ADMIN_EMAIL,
    lineOaId: "@424scqfg",
    lineChannelAccessToken,
    lineChannelSecret,
    adminLineUserId: "",
    logoUrl: "",
    coverImageUrl: "",
    address: "",
    phone: "",
    openDays: [1, 2, 3, 4, 5, 6],
    openTime: "09:00",
    closeTime: "20:00",
    slotDurationMinutes: 60,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Created tenant document");
  console.log("tenantId:", tenantId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
