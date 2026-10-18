"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { isLocalAuthEmulatorConfig } from "./local-auth-config.mjs";

const appName = "smartsolutiontek-local-auth";
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let functionsInstance: Functions | null = null;

/** Firebase Auth stays disabled unless its target is the dedicated local emulator. */
export function getLocalFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROJECT_ID;
  const emulatorUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
  if (!projectId || !emulatorUrl || !isLocalAuthEmulatorConfig({ projectId, emulatorUrl })) return null;
  if (authInstance) return authInstance;

  const app = getApps().find((candidate) => candidate.name === appName)
    ?? initializeApp({
      apiKey: "demo-key",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      appId: "1:000000000000:web:smartsolutiontek-local",
      messagingSenderId: "000000000000",
    }, appName);
  authInstance = getAuth(app);
  connectAuthEmulator(authInstance, emulatorUrl, { disableWarnings: true });
  return authInstance;
}

/** Firestore stays bound to the local emulator; cloud targets are never inferred. */
export function getLocalFirebaseFirestore(): Firestore | null {
  const auth = getLocalFirebaseAuth();
  if (!auth) return null;
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(auth.app);
    connectFirestoreEmulator(firestoreInstance, "127.0.0.1", 8080);
  }
  return firestoreInstance;
}

/** Storage stays bound to the local emulator; cloud targets are never inferred. */
export function getLocalFirebaseStorage(): FirebaseStorage | null {
  const auth = getLocalFirebaseAuth();
  if (!auth) return null;
  if (!storageInstance) {
    storageInstance = getStorage(auth.app);
    connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
  }
  return storageInstance;
}

/** Callable Functions stay bound to the local emulator; cloud targets are never inferred. */
export function getLocalFirebaseFunctions(): Functions | null {
  const auth = getLocalFirebaseAuth();
  if (!auth) return null;
  if (!functionsInstance) {
    functionsInstance = getFunctions(auth.app, "us-central1");
    connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
  }
  return functionsInstance;
}
