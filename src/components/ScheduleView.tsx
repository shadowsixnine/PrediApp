import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  Users,
  MapPin,
  Map,
  Sparkles,
  Settings2,
  CheckCircle2,
  Clock,
  Lock,
  Download,
  CalendarPlus,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import {
  ScheduleItem,
  MeetingPoint,
  Conductor,
  Territory,
  UserRole,
} from '../types';
import { exportSchedulePDF } from '../utils/pdfExporter';
import {
  signInWithGoogleCalendar,
  createGoogleCalendarEvent,
  initAuth,
  logoutGoogle,
} from '../lib/googleCalendar';
import { User } from 'firebase/auth';

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  meetingPoints: MeetingPoint[];
  conductors: Conductor[];
  territories: Territory[];
  userRole: UserRole;
  onSaveScheduleItem: (item: ScheduleItem) => void;
  onDeleteScheduleItem: (id: string) => void;
  onGenerate15DayProgram: (newSchedules: ScheduleItem[]) => void;
  onAddMeetingPoint: (mp: MeetingPoint) => void;
  onUpdateMeetingPoint: (mp: MeetingPoint) => void;
  onDeleteMeetingPoint: (id: string) => void;
  onAddConductor: (c: Conductor) => void;
  onUpdateConductor: (c: Conductor) => void;
  onDeleteConductor: (id: string) => void;
  onAddTerritory: (t: Territory) => void;
  onUpdateTerritory: (t: Territory) => void;
  onDeleteTerritory: (id: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  meetingPoints,
  conductors,
  territories,
  userRole,
  onSaveScheduleItem,
  onDeleteScheduleItem,
  onGenerate15DayProgram,
  onAddMeetingPoint,
  onUpdateMeetingPoint,
  onDeleteMeetingPoint,
  onAddConductor,
  onUpdateConductor,
  onDeleteConductor,
  onAddTerritory,
  onUpdateTerritory,
  onDeleteTerritory,
}) => {
  const isSuper = userRole === 'superintendente';
  const isReadOnly = userRole === 'usuario';

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [show15DayModal, setShow15DayModal] = useState(false);

  // Google Calendar Integration State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [calendarSyncItem, setCalendarSyncItem] = useState<ScheduleItem | null>(null);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState('');
  const [calendarError, setCalendarError] = useState('');

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningInGoogle(true);
    setCalendarError('');
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setCalendarSuccess(`Conectado como ${res.user.displayName || res.user.email}`);
        setTimeout(() => setCalendarSuccess(''), 4000);
      }
    } catch (err: any) {
      setCalendarError('Error al iniciar sesión con Google: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  const handleConfirmCalendarSync = async () => {
    if (!calendarSyncItem) return;
    let token = googleToken;

    if (!token) {
      try {
        const res = await signInWithGoogleCalendar();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
          setGoogleToken(res.accessToken);
        } else {
          return;
        }
      } catch (err: any) {
        setCalendarError('Debes conectar tu cuenta de Google para agendar el evento.');
        return;
      }
    }

    setIsSyncingCalendar(true);
    setCalendarError('');
    try {
      await createGoogleCalendarEvent(token, calendarSyncItem);
      setCalendarSuccess(`¡Salida del ${calendarSyncItem.date} añadida a Google Calendar!`);
      setCalendarSyncItem(null);
      setTimeout(() => setCalendarSuccess(''), 4000);
    } catch (err: any) {
      setCalendarError('Error al crear evento: ' + (err.message || 'Verifica permisos'));
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Form State for Single Schedule Item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:30 AM');
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [formMeetingPointId, setFormMeetingPointId] = useState(meetingPoints[0]?.id || '');
  const [formAddress, setFormAddress] = useState(meetingPoints[0]?.address || '');
  const [formConductorId, setFormConductorId] = useState(conductors[0]?.id || '');
  const [formTerritoryNumber, setFormTerritoryNumber] = useState(territories[0]?.number || '01');
  const [formObservations, setFormObservations] = useState('');

  // Config Master Data Tab State
  const [configSubTab, setConfigSubTab] = useState<'puntos' | 'encargados' | 'territorios'>('puntos');
  
  // Create / Edit Meeting Point state
  const [editingMpId, setEditingMpId] = useState<string | null>(null);
  const [newMpName, setNewMpName] = useState('');
  const [newMpAddress, setNewMpAddress] = useState('');

  // Create / Edit Conductor state
  const [editingCondId, setEditingCondId] = useState<string | null>(null);
  const [newCondName, setNewCondName] = useState('');
  const [newCondPhone, setNewCondPhone] = useState('');
  const [newCondRole, setNewCondRole] = useState('Conductor de Predicación');
  const [newCondDuties, setNewCondDuties] = useState('Organizar la predicación del día.');

  // Create / Edit Territory state
  const [editingTerrId, setEditingTerrId] = useState<string | null>(null);
  const [newTerrNum, setNewTerrNum] = useState('');
  const [newTerrName, setNewTerrName] = useState('');
  const [newTerrZone, setNewTerrZone] = useState('Zona Congregación');

  // 15-day Generator State
  const [startDate15, setStartDate15] = useState(new Date().toISOString().split('T')[0]);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[d.getDay()];
  };

  const handleOpenAdd = (item?: ScheduleItem) => {
    if (isReadOnly) return;
    if (item) {
      setEditingId(item.id);
      setFormDate(item.date);
      setFormTime(item.time);
      setIsCustomTime(!['09:00 AM', '09:30 AM', '10:00 AM', '16:30 PM', '17:00 PM', '18:00 PM'].includes(item.time));
      setCustomTimeInput(item.time);
      setFormMeetingPointId(item.meetingPointId);
      setFormAddress(item.address);
      setFormConductorId(item.conductorId);
      setFormTerritoryNumber(item.territoryNumber);
      setFormObservations(item.observations);
    } else {
      setEditingId(null);
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormTime('09:30 AM');
      setIsCustomTime(false);
      setCustomTimeInput('');
      setFormMeetingPointId(meetingPoints[0]?.id || '');
      setFormAddress(meetingPoints[0]?.address || '');
      setFormConductorId(conductors[0]?.id || '');
      setFormTerritoryNumber(territories[0]?.number || '01');
      setFormObservations('');
    }
    setShowAddModal(true);
  };

  const handleMeetingPointSelectChange = (mpId: string) => {
    setFormMeetingPointId(mpId);
    const found = meetingPoints.find((m) => m.id === mpId);
    if (found) {
      setFormAddress(found.address);
    }
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mp = meetingPoints.find((m) => m.id === formMeetingPointId);
    const cond = conductors.find((c) => c.id === formConductorId);
    const terr = territories.find((t) => t.number === formTerritoryNumber);

    const finalTime = isCustomTime && customTimeInput.trim() ? customTimeInput.trim() : formTime;

    const newItem: ScheduleItem = {
      id: editingId || 'sch-' + Date.now(),
      date: formDate,
      dayOfWeek: getDayName(formDate),
      time: finalTime,
      meetingPointId: formMeetingPointId,
      meetingPointName: mp ? mp.name : 'Punto de Encuentro',
      address: formAddress || (mp ? mp.address : ''),
      conductorId: formConductorId,
      conductorName: cond ? cond.name : 'Encargado',
      territoryId: terr ? terr.id : 'terr-' + formTerritoryNumber,
      territoryNumber: formTerritoryNumber,
      observations: formObservations,
    };

    onSaveScheduleItem(newItem);
    setShowAddModal(false);
  };

  const handleGenerate15DaysSubmit = () => {
    if (meetingPoints.length === 0 || conductors.length === 0 || territories.length === 0) return;

    const newItems: ScheduleItem[] = [...schedules];
    const start = new Date(startDate15 + 'T00:00:00');

    for (let i = 0; i < 15; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayName = getDayName(dateStr);

      const mp = meetingPoints[i % meetingPoints.length];
      const cond = conductors[i % conductors.length];
      const terr = territories[i % territories.length];

      newItems.push({
        id: `sch-gen-${dateStr}-am-${i}`,
        date: dateStr,
        dayOfWeek: dayName,
        time: '09:30 AM',
        meetingPointId: mp.id,
        meetingPointName: mp.name,
        address: mp.address,
        conductorId: cond.id,
        conductorName: cond.name,
        territoryId: terr.id,
        territoryNumber: terr.number,
        observations: `Programa rotativo generado. Salida matutina.`,
      });

      if (dayName === 'Sábado' || dayName === 'Domingo' || i % 3 === 0) {
        const afternoonCond = conductors[(i + 1) % conductors.length];
        const afternoonTerr = territories[(i + 1) % territories.length];
        newItems.push({
          id: `sch-gen-${dateStr}-pm-${i}`,
          date: dateStr,
          dayOfWeek: dayName,
          time: '16:30 PM',
          meetingPointId: mp.id,
          meetingPointName: mp.name,
          address: mp.address,
          conductorId: afternoonCond.id,
          conductorName: afternoonCond.name,
          territoryId: afternoonTerr.id,
          territoryNumber: afternoonTerr.number,
          observations: `Salida de la tarde y revisitas.`,
        });
      }
    }

    onGenerate15DayProgram(newItems);
    setGenSuccessMsg('¡Programa de 15 días generado y sincronizado para todos los dispositivos!');
    setTimeout(() => {
      setGenSuccessMsg('');
      setShow15DayModal(false);
    }, 1500);
  };

  // HANDLERS FOR MEETING POINTS EDIT & DELETE
  const handleStartEditMp = (mp: MeetingPoint) => {
    setEditingMpId(mp.id);
    setNewMpName(mp.name);
    setNewMpAddress(mp.address);
  };

  const handleAddOrUpdateMpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMpName.trim()) return;

    if (editingMpId) {
      onUpdateMeetingPoint({
        id: editingMpId,
        name: newMpName.trim(),
        address: newMpAddress.trim() || 'Dirección no especificada',
      });
      setEditingMpId(null);
    } else {
      onAddMeetingPoint({
        id: 'mp-' + Date.now(),
        name: newMpName.trim(),
        address: newMpAddress.trim() || 'Dirección no especificada',
      });
    }

    setNewMpName('');
    setNewMpAddress('');
  };

  // HANDLERS FOR CONDUCTORS EDIT & DELETE
  const handleStartEditCond = (c: Conductor) => {
    setEditingCondId(c.id);
    setNewCondName(c.name);
    setNewCondPhone(c.phone);
    setNewCondRole(c.role);
    setNewCondDuties(c.duties);
  };

  const handleAddOrUpdateCondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondName.trim()) return;

    if (editingCondId) {
      onUpdateConductor({
        id: editingCondId,
        name: newCondName.trim(),
        phone: newCondPhone.trim() || '+56 9 0000 0000',
        role: newCondRole,
        duties: newCondDuties,
        active: true,
      });
      setEditingCondId(null);
    } else {
      onAddConductor({
        id: 'cond-' + Date.now(),
        name: newCondName.trim(),
        phone: newCondPhone.trim() || '+56 9 0000 0000',
        role: newCondRole,
        duties: newCondDuties,
        active: true,
      });
    }

    setNewCondName('');
    setNewCondPhone('');
    setNewCondDuties('Organizar la predicación del día.');
  };

  // HANDLERS FOR TERRITORIES EDIT & DELETE
  const handleStartEditTerr = (t: Territory) => {
    setEditingTerrId(t.id);
    setNewTerrNum(t.number);
    setNewTerrName(t.name);
    setNewTerrZone(t.zone);
  };

  const handleAddOrUpdateTerrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerrNum.trim()) return;
    const padNum = newTerrNum.trim().padStart(2, '0');

    if (editingTerrId) {
      const existing = territories.find((t) => t.id === editingTerrId);
      if (existing) {
        onUpdateTerritory({
          ...existing,
          number: padNum,
          name: newTerrName.trim() || `Territorio ${padNum}`,
          zone: newTerrZone.trim() || 'Zona Congregación',
        });
      }
      setEditingTerrId(null);
    } else {
      onAddTerritory({
        id: 'terr-' + padNum,
        number: padNum,
        name: newTerrName.trim() || `Territorio ${padNum}`,
        zone: newTerrZone.trim() || 'Zona Congregación',
        completed: false,
        center: [-33.4489, -70.6693],
        blocks: [
          { id: `b-${padNum}-A`, letter: 'A', name: 'Cuadra A', completed: false },
          { id: `b-${padNum}-B`, letter: 'B', name: 'Cuadra B', completed: false },
          { id: `b-${padNum}-C`, letter: 'C', name: 'Cuadra C', completed: false },
          { id: `b-${padNum}-D`, letter: 'D', name: 'Cuadra D', completed: false },
        ],
      });
    }

    setNewTerrNum('');
    setNewTerrName('');
    setNewTerrZone('Zona Congregación');
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#2c362c] border border-[#212921] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5a6e5a]/40 text-[#e8ede8] text-xs font-semibold border border-[#e8ede8]/20 mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
            Configuración del Programa
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
            Programa de Predicación en Línea
          </h2>
          <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
            Crea, programa y sincroniza los horarios, lugares de encuentro, encargados y territorios para toda la congregación.
          </p>
        </div>

        {!isReadOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            {googleUser ? (
              <button
                onClick={handleGoogleLogout}
                className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-500/40 transition backdrop-blur-xs"
                title={`Sesión iniciada con Google como ${googleUser.displayName || googleUser.email}. Clic para cerrar sesión.`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="max-w-[120px] truncate">{googleUser.displayName || 'Google'}</span>
                <LogOut className="w-3.5 h-3.5 text-emerald-200 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningInGoogle}
                className="px-3.5 py-2 bg-white text-gray-800 hover:bg-gray-100 text-xs font-bold rounded-xl flex items-center gap-2 border border-gray-300 transition shadow-xs"
                title="Conectar Google Calendar para agendar las salidas"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isSigningInGoogle ? 'Conectando...' : 'Google Calendar'}
              </button>
            )}

            <button
              onClick={() => exportSchedulePDF(schedules)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] text-xs font-bold rounded-xl flex items-center gap-2 border border-white/20 transition backdrop-blur-sm shadow-xs"
              title="Descargar PDF del programa de predicación"
            >
              <Download className="w-4 h-4 text-emerald-300" /> Exportar PDF
            </button>

            {isSuper && (
              <>
                <button
                  onClick={() => setShow15DayModal(true)}
                  className="px-3.5 py-2 bg-[#5a6e5a] hover:bg-[#465646] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" /> Generar 15 Días
                </button>

                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] text-xs font-semibold rounded-xl flex items-center gap-2 border border-white/20 transition backdrop-blur-sm"
                >
                  <Settings2 className="w-4 h-4 text-[#e8ede8]" /> Editar Listas Maestras
                </button>
              </>
            )}

            <button
              onClick={() => handleOpenAdd()}
              className="px-3.5 py-2 bg-[#e8ede8] text-[#2c362c] text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-white transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#2c362c]" /> Configurar Horario
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 bg-white/10 rounded-xl border border-white/20 text-xs text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Modo Lectura Congregación</span>
          </div>
        )}
      </div>

      {/* Alerts for Calendar */}
      {calendarSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{calendarSuccess}</span>
        </div>
      )}

      {calendarError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{calendarError}</span>
        </div>
      )}

      {/* Program Schedule List */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 space-y-4 shadow-sm text-[#2a2a2a]">
        <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
          <h3 className="text-sm font-serif-title font-bold text-[#2c362c] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#5a6e5a]" />
            Salidas Agendadas ({sortedSchedules.length})
          </h3>
          <span className="text-xs text-[#6b6b6b]">Sincronización con Google Calendar</span>
        </div>

        {sortedSchedules.length === 0 ? (
          <div className="p-8 text-center text-[#6b6b6b] text-xs italic">
            No hay programas agendados. Usa el botón "Configurar Horario" o "Generar 15 Días".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2a2a2a]">
              <thead className="bg-[#f8f6f2] text-[#2c362c] font-bold uppercase text-[10px] tracking-wider border-b border-[#e0ddd7]">
                <tr>
                  <th className="p-3">Fecha y Día</th>
                  <th className="p-3">Hora Personalizada</th>
                  <th className="p-3">Lugar de Encuentro y Dirección</th>
                  <th className="p-3">Encargado</th>
                  <th className="p-3">Territorio</th>
                  <th className="p-3">Observaciones</th>
                  <th className="p-3 text-right">Acciones / Calendar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0ddd7]">
                {sortedSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f6f2] transition">
                    <td className="p-3 font-semibold text-[#2a2a2a] whitespace-nowrap">
                      {item.date}
                      <span className="block text-[11px] font-normal text-[#5a6e5a]">{item.dayOfWeek}</span>
                    </td>
                    <td className="p-3 text-[#2c362c] font-bold whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-[#e8ede8] text-[#2c362c] px-2.5 py-1 rounded-lg border border-[#d2ddd2]">
                        <Clock className="w-3.5 h-3.5 text-[#5a6e5a]" />
                        {item.time}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-[#2a2a2a]">{item.meetingPointName}</p>
                      <p className="text-[11px] text-[#6b6b6b]">{item.address}</p>
                    </td>
                    <td className="p-3 font-medium text-[#2a2a2a] whitespace-nowrap">
                      {item.conductorName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2] rounded font-bold">
                        Territorio #{item.territoryNumber}
                      </span>
                    </td>
                    <td className="p-3 text-[#6b6b6b] italic max-w-xs truncate">
                      {item.observations || '—'}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setCalendarSyncItem(item)}
                        className="p-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition border border-emerald-200 inline-flex items-center gap-1 text-[11px] font-bold px-2"
                        title="Agendar esta salida en tu Google Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Agendar</span>
                      </button>

                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleOpenAdd(item)}
                            className="p-1.5 text-[#6b6b6b] hover:text-[#2c362c] hover:bg-[#e8ede8] rounded transition"
                            title="Editar Horario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isSuper && (
                            <button
                              onClick={() => onDeleteScheduleItem(item.id)}
                              className="p-1.5 text-[#6b6b6b] hover:text-rose-700 hover:bg-rose-50 rounded transition"
                              title="Eliminar Salida"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR GOOGLE CALENDAR EVENT CREATION */}
      {calendarSyncItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
                Agendar en Google Calendar
              </h3>
              <button
                onClick={() => setCalendarSyncItem(null)}
                className="text-[#6b6b6b] hover:text-[#2a2a2a]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              ¿Deseas añadir la siguiente salida de predicación a tu Google Calendar personal?
            </p>

            <div className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] text-xs space-y-1.5">
              <p className="font-bold text-[#2c362c]">
                📅 {calendarSyncItem.dayOfWeek} {calendarSyncItem.date} a las {calendarSyncItem.time}
              </p>
              <p className="text-gray-700">
                📍 <strong>Lugar:</strong> {calendarSyncItem.meetingPointName} ({calendarSyncItem.address})
              </p>
              <p className="text-gray-700">
                👤 <strong>Encargado:</strong> {calendarSyncItem.conductorName}
              </p>
              <p className="text-gray-700">
                🗺️ <strong>Territorio:</strong> #{calendarSyncItem.territoryNumber}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCalendarSyncItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCalendarSync}
                disabled={isSyncingCalendar}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
              >
                {isSyncingCalendar ? (
                  'Agendando...'
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 text-emerald-300" />
                    Confirmar y Crear Evento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SINGLE SCHEDULE ITEM WITH CUSTOM TIME CONFIG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5a6e5a]" />
                {editingId ? 'Editar Salida del Programa' : 'Configurar Horario de Predicación'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Configurar Hora *</label>
                  {!isCustomTime ? (
                    <div className="space-y-1">
                      <select
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                      >
                        <option value="09:00 AM">09:00 AM (Mañana temprana)</option>
                        <option value="09:30 AM">09:30 AM (Mañana habitual)</option>
                        <option value="10:00 AM">10:00 AM (Mañana tardía)</option>
                        <option value="16:30 PM">16:30 PM (Tarde habitual)</option>
                        <option value="17:00 PM">17:00 PM (Tarde)</option>
                        <option value="18:00 PM">18:00 PM (Atardecer)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTime(true);
                          setCustomTimeInput(formTime);
                        }}
                        className="text-[#5a6e5a] hover:underline font-semibold text-[11px]"
                      >
                        + Ingresar hora personalizada libre
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        placeholder="Ej: 08:15 AM, 11:30 AM, 19:00 PM"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomTime(false)}
                        className="text-[#6b6b6b] hover:underline font-medium text-[11px]"
                      >
                        Volver a lista prediseñada
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Lugar de Encuentro *</label>
                <select
                  value={formMeetingPointId}
                  onChange={(e) => handleMeetingPointSelectChange(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                >
                  {meetingPoints.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.address})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Dirección del Encuentro</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Encargado *</label>
                  <select
                    value={formConductorId}
                    onChange={(e) => setFormConductorId(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    {conductors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Territorio Asignado *</label>
                  <select
                    value={formTerritoryNumber}
                    onChange={(e) => setFormTerritoryNumber(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 font-bold text-[#5a6e5a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    {territories.map((t) => (
                      <option key={t.id} value={t.number}>Territorio #{t.number} - {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Observaciones / Notas de Salida</label>
                <input
                  type="text"
                  placeholder="Ej: Salida especial de revistas / Predicación pública"
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl hover:bg-[#f1ede6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5a6e5a] text-white font-bold rounded-xl hover:bg-[#465646] shadow-xs"
                >
                  Guardar Horario Sincronizado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 15-DAY PROGRAM GENERATOR */}
      {show15DayModal && isSuper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5a6e5a]" /> Generador de Programa de 15 Días
              </h3>
              <button onClick={() => setShow15DayModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            {genSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{genSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#2a2a2a]">
                <p className="text-[#6b6b6b]">
                  Esta herramienta genera automáticamente un calendario completo de 15 días rotando equilibradamente los <strong>Lugares de Encuentro</strong>, <strong>Encargados</strong> y <strong>Territorios</strong> configurados.
                </p>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Fecha de inicio del programa *</label>
                  <input
                    type="date"
                    value={startDate15}
                    onChange={(e) => setStartDate15(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div className="p-3 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] space-y-1 text-[11px] text-[#6b6b6b]">
                  <p className="font-semibold text-[#2c362c]">Resumen de Rotación:</p>
                  <p>• {meetingPoints.length} Lugares de encuentro disponibles</p>
                  <p>• {conductors.length} Encargados activos</p>
                  <p>• {territories.length} Territorios de la congregación</p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShow15DayModal(false)}
                    className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerate15DaysSubmit}
                    className="px-4 py-2 bg-[#5a6e5a] text-white font-bold rounded-xl hover:bg-[#465646] shadow-xs"
                  >
                    Generar 15 Días
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIG MASTER DATA LISTS WITH EDIT AND DELETE FOR ENCARGADOS, MAPAS, LUGARES */}
      {showConfigModal && isSuper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#5a6e5a]" /> Editar y Administrar Listas Maestras
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            {/* Sub-tabs */}
            <div className="flex space-x-2 border-b border-[#e0ddd7] pb-2">
              {[
                { id: 'puntos', label: 'Lugares de Encuentro', icon: MapPin },
                { id: 'encargados', label: 'Encargados', icon: Users },
                { id: 'territorios', label: 'Mapas / Territorios', icon: Map },
              ].map((st) => {
                const Icon = st.icon;
                const isActive = configSubTab === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setConfigSubTab(st.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive ? 'bg-[#5a6e5a] text-white' : 'bg-[#f8f6f2] text-[#6b6b6b] hover:text-[#2a2a2a]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SUBTAB 1: LUGARES DE ENCUENTRO (EDIT & DELETE) */}
            {configSubTab === 'puntos' && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleAddOrUpdateMpSubmit} className="bg-[#f8f6f2] p-3 rounded-xl border border-[#e0ddd7] space-y-2">
                  <span className="font-bold text-[#2c362c] block">
                    {editingMpId ? '✏️ Editar Lugar de Encuentro' : '➕ Agregar Nuevo Lugar de Encuentro'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre (Ej: Salón del Reino, Plaza Central)"
                      value={newMpName}
                      onChange={(e) => setNewMpName(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                    <input
                      type="text"
                      placeholder="Dirección exacta"
                      value={newMpAddress}
                      onChange={(e) => setNewMpAddress(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="px-3 py-1.5 bg-[#5a6e5a] text-white font-bold rounded">
                      {editingMpId ? 'Guardar Cambios' : '+ Agregar Lugar'}
                    </button>
                    {editingMpId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMpId(null);
                          setNewMpName('');
                          setNewMpAddress('');
                        }}
                        className="px-3 py-1.5 bg-stone-200 text-[#2a2a2a] rounded font-semibold"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {meetingPoints.map((m) => (
                    <div key={m.id} className="p-2.5 bg-white rounded-lg border border-[#e0ddd7] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#2a2a2a]">{m.name}</p>
                        <p className="text-[#6b6b6b] text-[11px]">{m.address}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditMp(m)}
                          className="p-1.5 text-[#5a6e5a] hover:bg-emerald-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMeetingPoint(m.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 2: ENCARGADOS (EDIT & DELETE) */}
            {configSubTab === 'encargados' && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleAddOrUpdateCondSubmit} className="bg-[#f8f6f2] p-3 rounded-xl border border-[#e0ddd7] space-y-2">
                  <span className="font-bold text-[#2c362c] block">
                    {editingCondId ? '✏️ Editar Encargado' : '➕ Agregar Nuevo Encargado'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
                      value={newCondName}
                      onChange={(e) => setNewCondName(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono (+56 9...)"
                      value={newCondPhone}
                      onChange={(e) => setNewCondPhone(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                    <input
                      type="text"
                      placeholder="Rol (Ej: Encargado de Grupo 1)"
                      value={newCondRole}
                      onChange={(e) => setNewCondRole(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="px-3 py-1.5 bg-[#5a6e5a] text-white font-bold rounded">
                      {editingCondId ? 'Guardar Cambios' : '+ Agregar Encargado'}
                    </button>
                    {editingCondId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCondId(null);
                          setNewCondName('');
                          setNewCondPhone('');
                        }}
                        className="px-3 py-1.5 bg-stone-200 text-[#2a2a2a] rounded font-semibold"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {conductors.map((c) => (
                    <div key={c.id} className="p-2.5 bg-white rounded-lg border border-[#e0ddd7] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#2a2a2a]">{c.name}</p>
                        <p className="text-[#6b6b6b] text-[11px]">{c.role} • {c.phone}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditCond(c)}
                          className="p-1.5 text-[#5a6e5a] hover:bg-emerald-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteConductor(c.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 3: TERRITORIOS / MAPAS EN LINEA (EDIT & DELETE) */}
            {configSubTab === 'territorios' && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleAddOrUpdateTerrSubmit} className="bg-[#f8f6f2] p-3 rounded-xl border border-[#e0ddd7] space-y-2">
                  <span className="font-bold text-[#2c362c] block">
                    {editingTerrId ? '✏️ Editar Mapa / Territorio' : '➕ Agregar Nuevo Mapa en Línea'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Número (Ej: 06)"
                      value={newTerrNum}
                      onChange={(e) => setNewTerrNum(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                    <input
                      type="text"
                      placeholder="Nombre del sector"
                      value={newTerrName}
                      onChange={(e) => setNewTerrName(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                    <input
                      type="text"
                      placeholder="Zona (Ej: Zona Norte)"
                      value={newTerrZone}
                      onChange={(e) => setNewTerrZone(e.target.value)}
                      className="bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a]"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="px-3 py-1.5 bg-[#5a6e5a] text-white font-bold rounded">
                      {editingTerrId ? 'Guardar Cambios' : '+ Agregar Mapa'}
                    </button>
                    {editingTerrId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTerrId(null);
                          setNewTerrNum('');
                          setNewTerrName('');
                        }}
                        className="px-3 py-1.5 bg-stone-200 text-[#2a2a2a] rounded font-semibold"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {territories.map((t) => (
                    <div key={t.id} className="p-2.5 bg-white rounded-lg border border-[#e0ddd7] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#5a6e5a]">Territorio #{t.number} — {t.name}</p>
                        <p className="text-[#6b6b6b] text-[11px]">{t.zone} • {t.blocks.length} Cuadras</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditTerr(t)}
                          className="p-1.5 text-[#5a6e5a] hover:bg-emerald-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTerritory(t.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Eliminar Mapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
