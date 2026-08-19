export type UserRole = 'superintendente' | 'encargado' | 'usuario';

export interface Block {
  id: string;
  letter: string; // e.g. "A", "B", "C"
  name: string; // e.g. "Cuadra A - Av. Principal #100-200"
  completed: boolean;
  lastCompletedDate?: string; // YYYY-MM-DD
  coordinates?: [number, number][]; // Polygon LatLngs
}

export interface Territory {
  id: string;
  number: string; // e.g., "01", "02"
  name: string; // e.g., "Territorio 01 - Centro Urbano"
  zone: string; // e.g. "Zona Norte", "Zona Centro"
  completed: boolean;
  lastCompletedDate?: string;
  blocks: Block[];
  center: [number, number]; // [lat, lng]
  boundary?: [number, number][]; // Polygon coordinates
  notes?: string;
}

export interface MeetingPoint {
  id: string;
  name: string; // e.g. "Salón del Reino", "Plaza Central", "Casa de Hno. Pérez"
  address: string;
  notes?: string;
}

export interface Conductor {
  id: string;
  name: string; // e.g. "Juan Pérez"
  phone: string;
  role: string; // e.g. "Encargado de Predicación", "Auxiliar de Grupo", "Conductor"
  duties: string; // e.g. "Supervisar grupos de la mañana, entregar tarjetas de territorio"
  active: boolean;
}

export interface DoNotCallRecord {
  id: string;
  territoryId: string;
  territoryNumber: string;
  address: string;
  blockLetter?: string;
  dateAdded: string; // YYYY-MM-DD
  notes: string; // e.g. "Propietario solicitó amablemente no ser visitado"
  residentName?: string;
}

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. "Lunes", "Martes"
  time: string; // e.g. "09:30 AM", "16:30 PM"
  meetingPointId: string;
  meetingPointName: string;
  address: string;
  conductorId: string;
  conductorName: string;
  territoryId: string;
  territoryNumber: string;
  observations: string;
}

export interface ConductorReport {
  id: string;
  conductorId: string;
  conductorName: string;
  date: string;
  type: 'asunto' | 'solicitud' | 'incidencia' | 'sugerencia';
  subject: string;
  description: string;
  status: 'pendiente' | 'en_proceso' | 'resuelto';
  territoryNumber?: string;
}

export interface S13Assignment {
  assignedTo: string;
  dateAssigned: string;
  dateCompleted: string;
}

export interface S13Record {
  territoryNumber: string;
  lastCompletedDate: string;
  assignments: [S13Assignment, S13Assignment, S13Assignment, S13Assignment];
}

export interface VisitLog {
  id: string;
  date: string;
  territoryNumber: string;
  blockLetter: string;
  address: string;
  status: 'completado' | 'parcial' | 'no_en_casa' | 'revisita' | 'estudio' | 'no_pasar';
  publisherName: string;
  notes?: string;
}
