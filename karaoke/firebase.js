import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY",
  authDomain: "COLOQUE_SEU_AUTH_DOMAIN",
  projectId: "COLOQUE_SEU_PROJECT_ID",
  storageBucket: "COLOQUE_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLOQUE_SEU_MESSAGING_SENDER_ID",
  appId: "COLOQUE_SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function signInGuest() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

async function signInHost(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function signOutCurrent() {
  await signOut(auth);
}

export {
  auth,
  db,
  onAuthStateChanged,
  signInGuest,
  signInHost,
  signOutCurrent
};
