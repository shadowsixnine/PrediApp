import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const config = firebaseConfig as any;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const TARGET_DB_ID = config.firestoreDatabaseId || 'ai-studio-gestindeterritor-ce39f5e4-d04d-4743-9b9e-21c36fcb293b';

export const db = TARGET_DB_ID
  ? getFirestore(app, TARGET_DB_ID)
  : getFirestore(app);

const DOC_ID = 'main_store';

export function subscribeToFirebaseData(onData: (data: any) => void) {
  try {
    const docRef = doc(db, 'appData', DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data());
        }
      },
      (error) => {
        console.warn('Firestore subscription error, using local data:', error);
      }
    );
  } catch (err) {
    console.warn('Firebase init error:', err);
    return () => {};
  }
}

export async function saveToFirebaseData(data: any) {
  try {
    const docRef = doc(db, 'appData', DOC_ID);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Error saving to Firebase Firestore:', err);
  }
}
