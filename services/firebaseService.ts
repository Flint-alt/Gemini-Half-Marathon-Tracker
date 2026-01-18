
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// NOTE: These are placeholders. To enable REAL sync, replace with your Firebase Console keys.
const firebaseConfig = {
  apiKey: "PLACEHOLDER_KEY",
  authDomain: "outrun-sync.firebaseapp.com",
  projectId: "outrun-sync",
  storageBucket: "outrun-sync.appspot.com",
  messagingSenderId: "000000000000",
  appId: "0:000000000000:web:000000000000"
};

// Check if we have real config; otherwise, we operate in "Local Simulation" mode
const isConfigured = !firebaseConfig.apiKey.includes("PLACEHOLDER");

let app, db, auth, googleProvider;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase Initialization Failed:", e);
  }
} else {
  console.warn("Outrun: Firebase keys not found. Operating in Local Simulation mode.");
  // Mock objects to prevent crashes
  auth = { onAuthStateChanged: (cb) => cb(null) }; 
}

export { auth, googleProvider };

export const syncUserData = async (uid: string, data: any) => {
  if (!isConfigured || !db) return;
  try {
    const userDoc = doc(db, "users", uid);
    await setDoc(userDoc, {
      ...data,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Cloud Sync Error:", err);
  }
};

export const subscribeToNeuralCloud = (uid: string, callback: (data: any) => void) => {
  if (!isConfigured || !db) return () => {};
  return onSnapshot(doc(db, "users", uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};
