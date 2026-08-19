import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ScheduleItem } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn && onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export async function createGoogleCalendarEvent(
  accessToken: string,
  item: ScheduleItem
) {
  // Build ISO date times
  let startTimeStr = item.time.split('-')[0].trim();
  if (!startTimeStr.includes(':')) {
    startTimeStr = '09:00';
  }

  // Format HH:mm
  const timeParts = startTimeStr.split(':');
  const hours = timeParts[0].padStart(2, '0');
  const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';

  const startDateTime = `${item.date}T${hours}:${minutes}:00`;
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

  const event = {
    summary: `Predicación: Territorio #${item.territoryNumber}`,
    location: `${item.meetingPointName} - ${item.address}`,
    description: `Programa de Predicación Pública y en Grupo\n\nEncargado: ${item.conductorName}\nTerritorio: #${item.territoryNumber}\nLugar de Encuentro: ${item.meetingPointName}\nDirección: ${item.address}\nObservaciones: ${item.observations || 'Ninguna'}\n\nOrganizado con PrediApp Congregación`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || 'Error al conectar con Google Calendar API'
    );
  }

  return await response.json();
}
