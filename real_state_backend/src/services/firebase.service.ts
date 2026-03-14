import admin from "firebase-admin";
import { readFileSync } from "fs";
import { isAbsolute, resolve } from "path";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function getFirebaseServiceAccountFromFile(): FirebaseServiceAccount | null {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!configuredPath) {
    return null;
  }

  const resolvedPath = isAbsolute(configuredPath)
    ? configuredPath
    : resolve(process.cwd(), configuredPath);

  try {
    const raw = readFileSync(resolvedPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<FirebaseServiceAccount>;

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }

    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  } catch {
    return null;
  }
}

function getFirebasePrivateKey(): string | undefined {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    return undefined;
  }

  return privateKey.replace(/\\n/g, "\n");
}

export function isFirebaseConfigured(): boolean {
  const serviceAccount = getFirebaseServiceAccountFromFile();
  if (serviceAccount) {
    return true;
  }

  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

function getFirebaseApp(): admin.app.App | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!admin.apps.length) {
    const serviceAccount = getFirebaseServiceAccountFromFile();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
      });
    } else {
      const privateKey = getFirebasePrivateKey();
      if (!privateKey) {
        return null;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
  }

  return admin.app();
}

function normalizeData(data?: Record<string, unknown>): Record<string, string> | undefined {
  if (!data) {
    return undefined;
  }

  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === null || value === undefined) {
      return acc;
    }

    if (typeof value === "string") {
      acc[key] = value;
      return acc;
    }

    acc[key] = JSON.stringify(value);
    return acc;
  }, {});
}

export async function sendPushToTokens(payload: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const app = getFirebaseApp();
  if (!app) {
    return {
      pushed: false,
      reason: "firebase_not_configured",
      successCount: 0,
      failureCount: 0,
      invalidTokens: [] as string[],
    };
  }

  if (!payload.tokens.length) {
    return {
      pushed: false,
      reason: "no_tokens",
      successCount: 0,
      failureCount: 0,
      invalidTokens: [] as string[],
    };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens: payload.tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: normalizeData(payload.data),
  };

  const result = await admin.messaging(app).sendEachForMulticast(message);

  const invalidTokens: string[] = [];
  result.responses.forEach((response, index) => {
    if (!response.success) {
      const errorCode = response.error?.code;
      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(payload.tokens[index]);
      }
    }
  });

  return {
    pushed: true,
    reason: "ok",
    successCount: result.successCount,
    failureCount: result.failureCount,
    invalidTokens,
  };
}
