import { saveToFirebaseData } from '../lib/firebase';
import {
  Territory,
  MeetingPoint,
  Conductor,
  DoNotCallRecord,
  ScheduleItem,
  ConductorReport,
  S13Record,
  VisitLog,
} from '../types';

export interface AppState {
  territories: Territory[];
  meetingPoints: MeetingPoint[];
  conductors: Conductor[];
  doNotCall: DoNotCallRecord[];
  schedules: ScheduleItem[];
  reports: ConductorReport[];
  s13Records: S13Record[];
  visitLogs: VisitLog[];
  pins?: { encargadoPin: string; superintendentePin: string };
}

const LOCAL_STORAGE_KEY = 'jw_territory_app_data_v1';

export async function fetchState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API connection offline, using localStorage fallback', err);
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveState(state: AppState): Promise<boolean> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  saveToFirebaseData(state);
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to post state to server API:', err);
    return false;
  }
}

export async function markTerritoryCompletedApi(
  territoryNumber: string,
  date: string,
  completedBlocks?: string[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/territories/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ territoryNumber, date, completedBlocks }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addDoNotCallApi(record: Partial<DoNotCallRecord>): Promise<boolean> {
  try {
    const res = await fetch('/api/donotcall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addReportApi(report: Partial<ConductorReport>): Promise<boolean> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    return res.ok;
  } catch {
    return false;
  }
}
