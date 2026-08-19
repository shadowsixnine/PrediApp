import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  User,
  Map as MapIcon,
  CheckCircle2,
  CheckSquare,
  Ban,
  Navigation,
  Calendar as CalendarIcon,
  Plus,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ScheduleItem,
  Territory,
  DoNotCallRecord,
  MeetingPoint,
  Conductor,
} from '../types';

interface HomeViewProps {
  schedules: ScheduleItem[];
  territories: Territory[];
  doNotCallRecords: DoNotCallRecord[];
  meetingPoints: MeetingPoint[];
  conductors: Conductor[];
  onCompleteTerritory: (
    territoryNumber: string,
    date: string,
    completedBlocks?: string[]
  ) => void;
  onAddDoNotCall: (record: Partial<DoNotCallRecord>) => void;
  onNavigateToMap: (territoryNumber: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  schedules,
  territories,
  doNotCallRecords,
  onCompleteTerritory,
  onAddDoNotCall,
  onNavigateToMap,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'horarios' | 'mapa' | 'completar' | 'nopasar'>('horarios');

  // Completion Form State
  const [completionType, setCompletionType] = useState<'total' | 'parcial'>('parcial');
  const [selectedBlockLetters, setSelectedBlockLetters] = useState<string[]>([]);
  const [completionSuccessMsg, setCompletionSuccessMsg] = useState<string>('');

  // Add Do Not Call Form State
  const [newDncAddress, setNewDncAddress] = useState('');
  const [newDncBlock, setNewDncBlock] = useState('A');
  const [newDncResident, setNewDncResident] = useState('');
  const [newDncNotes, setNewDncNotes] = useState('');
  const [dncSuccessMsg, setDncSuccessMsg] = useState('');

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filter schedules by selected date
  const todaySchedules = schedules.filter((s) => s.date === selectedDate);

  const handleOpenSchedule = (item: ScheduleItem, tab: 'horarios' | 'mapa' | 'completar' | 'nopasar' = 'horarios') => {
    setSelectedSchedule(item);
    setActiveModalTab(tab);
    setCompletionSuccessMsg('');
    setDncSuccessMsg('');

    const terr = territories.find((t) => t.number === item.territoryNumber);
    if (terr) {
      const alreadyCompleted = terr.blocks.filter((b) => b.completed).map((b) => b.letter);
      setSelectedBlockLetters(alreadyCompleted);
    } else {
      setSelectedBlockLetters([]);
    }
  };

  const handleGeolocate = () => {
    setIsLocating(true);
    setGeoError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          setGeoError('No se pudo obtener la ubicación: ' + err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoError('La geolocalización no está soportada en este navegador.');
      setIsLocating(false);
    }
  };

  const handleSaveCompletion = () => {
    if (!selectedSchedule) return;
    const dateToRecord = selectedDate;

    if (completionType === 'total') {
      onCompleteTerritory(selectedSchedule.territoryNumber, dateToRecord);
      setCompletionSuccessMsg(`¡Territorio ${selectedSchedule.territoryNumber} marcado como COMPLETADO totalmente!`);
    } else {
      onCompleteTerritory(selectedSchedule.territoryNumber, dateToRecord, selectedBlockLetters);
      setCompletionSuccessMsg(
        `¡Actualizadas cuadras (${selectedBlockLetters.join(', ') || 'Ninguna'}) para Territorio ${selectedSchedule.territoryNumber}!`);
    }
  };

  const handleAddDncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !newDncAddress.trim()) return;

    onAddDoNotCall({
      territoryNumber: selectedSchedule.territoryNumber,
      territoryId: selectedSchedule.territoryId,
      address: newDncAddress.trim(),
      blockLetter: newDncBlock,
      residentName: newDncResident.trim() || undefined,
      notes: newDncNotes.trim() || 'Registrado desde la predicación del día.',
    });

    setDncSuccessMsg('¡Dirección de "No Pasar" guardada exitosamente!');
    setNewDncAddress('');
    setNewDncResident('');
    setNewDncNotes('');
  };

  const currentTerritory = selectedSchedule
    ? territories.find((t) => t.number === selectedSchedule.territoryNumber)
    : null;

  const currentDncRecords = selectedSchedule
    ? doNotCallRecords.filter((d) => d.territoryNumber === selectedSchedule.territoryNumber)
    : [];

  return (
    <div className="space-y-6">
      {/* Date selector header banner */}
      <div className="bg-[#2c362c] rounded-2xl p-5 sm:p-6 text-white border border-[#212921] shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5a6e5a]/40 text-[#e8ede8] text-xs font-semibold border border-[#e8ede8]/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Predicación del Día Presente
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
              Horarios y Encuentros
            </h2>
            <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
              Selecciona una sesión de predicación para ver mapas, encargados, reporte de cuadras y registros de No Pasar.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/15 backdrop-blur-sm">
            <CalendarIcon className="w-4 h-4 text-[#e8ede8] ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none pr-2"
            />
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[11px] px-2.5 py-1 bg-[#5a6e5a] text-white font-bold rounded-lg hover:bg-[#4a5a4a] transition"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of sessions for selected date */}
      {todaySchedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-[#e0ddd7] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#e8ede8] flex items-center justify-center text-[#5a6e5a] mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif-title text-[#2a2a2a]">
            No hay programas agendados para este día ({selectedDate})
          </h3>
          <p className="text-[#6b6b6b] text-xs max-w-md mx-auto">
            Puedes cambiar de fecha o ir a la pestaña <strong>Programa</strong> para configurar las salidas de predicación de los próximos 15 días.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Summary Banner: Mapa Asignado del Día */}
          <div className="bg-[#f8f6f2] border border-[#e0ddd7] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0ddd7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5a6e5a] text-white flex items-center justify-center font-bold shadow-2xs">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-[#2c362c] text-sm sm:text-base">
                    Mapa(s) Asignado(s) para Hoy ({todaySchedules.length} {todaySchedules.length === 1 ? 'salida' : 'salidas'})
                  </h3>
                  <p className="text-[#6b6b6b] text-xs">
                    Consulta los territorios y cuadras que corresponden predicar en esta fecha.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick summary of assigned maps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaySchedules.map((sched) => {
                const terr = territories.find((t) => t.number === sched.territoryNumber);
                const dncCount = doNotCallRecords.filter((d) => d.territoryNumber === sched.territoryNumber).length;
                const completedBlocks = terr?.blocks.filter((b) => b.completed).length || 0;
                const totalBlocks = terr?.blocks.length || 0;

                return (
                  <div
                    key={`map-summary-${sched.id}`}
                    className="bg-white border border-[#e0ddd7] hover:border-[#5a6e5a] rounded-xl p-3.5 space-y-2 text-xs transition shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2c362c] text-sm flex items-center gap-1.5">
                          <MapIcon className="w-4 h-4 text-[#5a6e5a]" />
                          Mapa Territorio #{sched.territoryNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-[#6b6b6b] bg-[#f1ede6] px-2 py-0.5 rounded-md">
                          {sched.time}
                        </span>
                      </div>

                      {terr && (
                        <p className="text-[#6b6b6b] text-xs line-clamp-1">
                          {terr.name} <span className="text-[11px] font-medium text-[#5a6e5a]">({terr.zone})</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="text-[#6b6b6b]">Cuadras:</span>
                        <span className="font-bold text-[#2c362c]">
                          {completedBlocks}/{totalBlocks} completadas
                        </span>
                        {dncCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> {dncCount} No Pasar
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToMap(sched.territoryNumber);
                      }}
                      className="mt-2 w-full py-1.5 bg-[#5a6e5a] hover:bg-[#465646] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Ver Mapa de Territorio #{sched.territoryNumber}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards for each preaching schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todaySchedules.map((item) => {
              const terr = territories.find((t) => t.number === item.territoryNumber);
              const dncCount = doNotCallRecords.filter((d) => d.territoryNumber === item.territoryNumber).length;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenSchedule(item, 'horarios')}
                  className="group bg-white border border-[#e0ddd7] hover:border-[#5a6e5a] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top session bar */}
                    <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5a6e5a] animate-pulse" />
                        <span className="text-sm font-bold text-[#2c362c]">{item.time}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2]">
                        Territorio #{item.territoryNumber}
                      </span>
                    </div>

                    {/* Main Session Content */}
                    <div className="space-y-2.5 text-xs text-[#2a2a2a]">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#5a6e5a] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#2a2a2a] text-sm">{item.meetingPointName}</p>
                          <p className="text-[#6b6b6b] text-xs">{item.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[#6b6b6b]">
                        <User className="w-4 h-4 text-[#5a6e5a] shrink-0" />
                        <span>Encargado: <strong className="text-[#2a2a2a]">{item.conductorName}</strong></span>
                      </div>

                      {item.observations && (
                        <p className="text-[11px] text-[#6b6b6b] italic bg-[#f8f6f2] p-2.5 rounded-xl border border-[#e0ddd7]">
                          "{item.observations}"
                        </p>
                      )}
                    </div>

                    {/* PROMINENT ASSIGNED MAP CARD HIGHLIGHT */}
                    {terr && (
                      <div className="bg-[#f8f6f2] p-3 rounded-xl border border-[#e0ddd7] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#2c362c] flex items-center gap-1.5">
                            <MapIcon className="w-3.5 h-3.5 text-[#5a6e5a]" />
                            Mapa Asignado
                          </span>
                          <span className="text-[10px] text-[#6b6b6b] font-medium">{terr.zone}</span>
                        </div>

                        <p className="text-xs font-semibold text-[#2a2a2a] truncate">
                          {terr.name}
                        </p>

                        {/* List of Block Letters (Cuadras) */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {terr.blocks.map((b) => (
                            <span
                              key={b.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                b.completed
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-white text-[#2c362c] border-[#e0ddd7]'
                              }`}
                              title={`${b.name} (${b.completed ? 'Completada' : 'Pendiente'})`}
                            >
                              Cuadra {b.letter} {b.completed ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Territory completion pills summary */}
                    {terr && (
                      <div className="pt-3 border-t border-[#e0ddd7] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6b6b6b]">Avance:</span>
                          {terr.completed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#5a6e5a] font-medium bg-[#e8ede8] px-2 py-0.5 rounded border border-[#d2ddd2] text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-[#5a6e5a]" /> Parcial ({terr.blocks.filter((b) => b.completed).length}/{terr.blocks.length})
                            </span>
                          )}
                        </div>

                        {dncCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#fbf3ee] text-[#b57a58] rounded text-[10px] font-semibold border border-[#f2d9cb]">
                            <AlertTriangle className="w-3 h-3 text-[#b57a58]" /> {dncCount} No Pasar
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action button */}
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#5a6e5a] group-hover:text-[#2c362c] transition">
                      <span>Ver Detalles del Mapa</span>
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Schedule Action Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-[#2a2a2a]">
            {/* Modal Header */}
            <div className="bg-[#2c362c] px-5 py-4 border-b border-[#212921] flex items-center justify-between text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#e8ede8] text-[#2c362c]">
                    Territorio #{selectedSchedule.territoryNumber}
                  </span>
                  <span className="text-xs text-[#e8ede8]/80">
                    {selectedSchedule.time} • {selectedSchedule.dayOfWeek} {selectedSchedule.date}
                  </span>
                </div>
                <h3 className="text-lg font-serif-title font-normal text-[#e8ede8] mt-1">
                  {selectedSchedule.meetingPointName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#e8ede8] flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="bg-[#f8f6f2] px-5 border-b border-[#e0ddd7] flex space-x-2 overflow-x-auto">
              {[
                { id: 'horarios', label: 'Horarios', icon: Clock },
                { id: 'mapa', label: 'Mapa', icon: MapIcon },
                { id: 'completar', label: 'Marcar Avance', icon: CheckSquare },
                { id: 'nopasar', label: `No Pasar (${currentDncRecords.length})`, icon: Ban },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                      isActive
                        ? 'border-[#5a6e5a] text-[#2c362c] bg-white'
                        : 'border-transparent text-[#6b6b6b] hover:text-[#2a2a2a]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-[#2a2a2a]">
              {/* TAB 1: HORARIOS & DETALLES */}
              {activeModalTab === 'horarios' && (
                <div className="space-y-4">
                  <div className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] space-y-3">
                    <h4 className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">
                      Información del Encuentro de Predicación
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-[#6b6b6b]">Lugar de Encuentro</span>
                        <p className="font-semibold text-[#2a2a2a]">{selectedSchedule.meetingPointName}</p>
                        <p className="text-xs text-[#5a6e5a] flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> {selectedSchedule.address}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-[#6b6b6b]">Encargado de la Salida</span>
                        <p className="font-semibold text-[#2a2a2a]">{selectedSchedule.conductorName}</p>
                        <p className="text-xs text-[#6b6b6b]">
                          Horario: <strong className="text-[#2a2a2a]">{selectedSchedule.time}</strong>
                        </p>
                      </div>
                    </div>

                    {selectedSchedule.observations && (
                      <div className="pt-2 border-t border-[#e0ddd7]">
                        <span className="text-xs text-[#6b6b6b]">Observaciones:</span>
                        <p className="text-xs text-[#2a2a2a] italic mt-0.5">{selectedSchedule.observations}</p>
                      </div>
                    )}
                  </div>

                  {currentTerritory && (
                    <div className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">
                          Detalles del Territorio {currentTerritory.number}
                        </h4>
                        <span className="text-xs text-[#6b6b6b] font-medium">{currentTerritory.zone}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {currentTerritory.blocks.map((b) => (
                          <div
                            key={b.id}
                            className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col justify-between ${
                              b.completed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-white border-[#e0ddd7] text-[#2a2a2a]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">Cuadra {b.letter}</span>
                              {b.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-[#6b6b6b]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#6b6b6b] truncate mt-1">
                              {b.completed ? `Completada (${b.lastCompletedDate || 'reciente'})` : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedSchedule(null);
                            onNavigateToMap(selectedSchedule.territoryNumber);
                          }}
                          className="px-4 py-2 bg-[#5a6e5a] text-white text-xs font-bold rounded-xl hover:bg-[#465646] flex items-center gap-2 transition shadow-sm"
                        >
                          <MapIcon className="w-4 h-4" /> Ir al Mapa Interactivo Completo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MAPA & GEOLOCALIZACIÓN */}
              {activeModalTab === 'mapa' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#f8f6f2] p-3 rounded-xl border border-[#e0ddd7]">
                    <div className="text-xs">
                      <span className="font-bold text-[#2a2a2a]">
                        Territorio #{selectedSchedule.territoryNumber} - {currentTerritory?.name}
                      </span>
                      <p className="text-[#6b6b6b] text-[11px]">
                        Centro aproximado: {currentTerritory?.center[0].toFixed(4)}, {currentTerritory?.center[1].toFixed(4)}
                      </p>
                    </div>

                    <button
                      onClick={handleGeolocate}
                      disabled={isLocating}
                      className="px-3 py-1.5 bg-white hover:bg-[#f1ede6] text-[#2c362c] text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-[#e0ddd7] transition shadow-xs"
                    >
                      <Navigation className={`w-3.5 h-3.5 text-[#5a6e5a] ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Ubicando GPS...' : 'Mi Ubicación'}</span>
                    </button>
                  </div>

                  {geoError && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {geoError}
                    </p>
                  )}

                  {userLocation && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        📍 Ubicación GPS detectada: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">Activa</span>
                    </div>
                  )}

                  {/* Visual Map Overview Card */}
                  <div className="bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] p-4 space-y-3">
                    <div className="h-48 rounded-lg bg-[#e8ede8] border border-dashed border-[#5a6e5a] relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-white border border-[#5a6e5a]/30 flex items-center justify-center text-[#5a6e5a] mb-2 shadow-sm">
                        <MapIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif-title font-normal text-base text-[#2c362c]">
                        Mapas de Cuadras para Territorio #{selectedSchedule.territoryNumber}
                      </h4>
                      <p className="text-xs text-[#6b6b6b] max-w-sm mt-1">
                        Puedes ver el mapa interactivo completo con capas de KML/KMZ, geolocalización en tiempo real y limites en la pestaña general de Mapas.
                      </p>

                      <button
                        onClick={() => {
                          setSelectedSchedule(null);
                          onNavigateToMap(selectedSchedule.territoryNumber);
                        }}
                        className="mt-3 px-4 py-1.5 bg-[#5a6e5a] text-white text-xs font-bold rounded-lg hover:bg-[#465646] transition shadow-xs"
                      >
                        Abrir Visor de Mapas
                      </button>
                    </div>

                    {/* Quick list of blocks with letters */}
                    {currentTerritory && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#6b6b6b]">Cuadras asignadas:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {currentTerritory.blocks.map((b) => (
                            <div key={b.id} className="p-2 bg-white rounded-lg border border-[#e0ddd7] flex items-center justify-between">
                              <span className="font-bold text-[#5a6e5a]">Cuadra {b.letter}</span>
                              <span className="text-[#2a2a2a] truncate max-w-[180px]">{b.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${b.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-[#f1ede6] text-[#6b6b6b]'}`}>
                                {b.completed ? 'Listo' : 'Pendiente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COMPLETAR TERRITORIO */}
              {activeModalTab === 'completar' && (
                <div className="space-y-4">
                  <div className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] space-y-3">
                    <h4 className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">
                      Registrar Avance del Territorio #{selectedSchedule.territoryNumber}
                    </h4>

                    {completionSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{completionSuccessMsg}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs text-[#2a2a2a] font-semibold block">Selecciona tipo de avance:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          onClick={() => setCompletionType('parcial')}
                          className={`p-3 rounded-xl border cursor-pointer text-xs flex items-start gap-2.5 transition ${
                            completionType === 'parcial'
                              ? 'bg-[#e8ede8] border-[#5a6e5a] text-[#2c362c]'
                              : 'bg-white border-[#e0ddd7] text-[#6b6b6b] hover:border-[#b5ac9d]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="completionType"
                            checked={completionType === 'parcial'}
                            onChange={() => setCompletionType('parcial')}
                            className="mt-0.5 text-[#5a6e5a] focus:ring-[#5a6e5a]"
                          />
                          <div>
                            <span className="font-bold block text-[#2a2a2a]">Territorio Parcial</span>
                            <span className="text-[11px] text-[#6b6b6b]">Marcar cuadras específicas terminadas hoy (letras A, B, C...).</span>
                          </div>
                        </label>

                        <label
                          onClick={() => setCompletionType('total')}
                          className={`p-3 rounded-xl border cursor-pointer text-xs flex items-start gap-2.5 transition ${
                            completionType === 'total'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                              : 'bg-white border-[#e0ddd7] text-[#6b6b6b] hover:border-[#b5ac9d]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="completionType"
                            checked={completionType === 'total'}
                            onChange={() => setCompletionType('total')}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-600"
                          />
                          <div>
                            <span className="font-bold block text-[#2a2a2a]">Territorio Completado</span>
                            <span className="text-[11px] text-[#6b6b6b]">
                              Todo el territorio ha sido terminado completamente.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Block letter checkboxes if parcial */}
                    {completionType === 'parcial' && currentTerritory && (
                      <div className="space-y-2 pt-2 border-t border-[#e0ddd7]">
                        <span className="text-xs text-[#2a2a2a] font-semibold block">
                          Selecciona las letras de cuadras terminadas:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {currentTerritory.blocks.map((b) => {
                            const isChecked = selectedBlockLetters.includes(b.letter);
                            return (
                              <label
                                key={b.id}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-[#e8ede8] border-[#5a6e5a] text-[#2c362c]'
                                    : 'bg-white border-[#e0ddd7] text-[#6b6b6b] hover:border-[#b5ac9d]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBlockLetters([...selectedBlockLetters, b.letter]);
                                      } else {
                                        setSelectedBlockLetters(selectedBlockLetters.filter((l) => l !== b.letter));
                                      }
                                    }}
                                    className="rounded border-[#e0ddd7] text-[#5a6e5a] focus:ring-[#5a6e5a]"
                                  />
                                  <span className="font-bold">Cuadra {b.letter}</span>
                                </div>
                                <span className="text-[10px] text-[#6b6b6b] truncate max-w-[150px]">{b.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={handleSaveCompletion}
                        className="px-5 py-2.5 bg-[#5a6e5a] hover:bg-[#465646] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Guardar Estado en la Base de Datos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DIRECCIONES NO PASAR */}
              {activeModalTab === 'nopasar' && (
                <div className="space-y-4">
                  {/* Current Do Not Call list */}
                  <div className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#b57a58]" />
                        Direcciones "No Pasar" para Territorio #{selectedSchedule.territoryNumber}
                      </h4>
                      <span className="text-xs text-[#b57a58] font-semibold">
                        {currentDncRecords.length} Registradas
                      </span>
                    </div>

                    {currentDncRecords.length === 0 ? (
                      <p className="text-xs text-[#6b6b6b] italic py-2">
                        No hay direcciones de "No pasar" registradas en este territorio aún.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {currentDncRecords.map((rec) => (
                          <div key={rec.id} className="p-3 bg-white rounded-xl border border-[#f2d9cb] text-xs space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#b57a58]">{rec.address}</span>
                              {rec.blockLetter && (
                                <span className="px-2 py-0.5 bg-[#fbf3ee] text-[#b57a58] font-mono text-[10px] rounded border border-[#f2d9cb]">
                                  Cuadra {rec.blockLetter}
                                </span>
                              )}
                            </div>
                            {rec.residentName && (
                              <p className="text-[#6b6b6b] text-[11px]">Residente: {rec.residentName}</p>
                            )}
                            <p className="text-[#2a2a2a] text-[11px]">{rec.notes}</p>
                            <span className="text-[10px] text-[#6b6b6b] block pt-1">Agregado el {rec.dateAdded}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add new Do Not Call address form */}
                  <form onSubmit={handleAddDncSubmit} className="bg-[#f8f6f2] p-4 rounded-xl border border-[#e0ddd7] space-y-3">
                    <h4 className="text-xs font-bold text-[#5a6e5a] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Registrar Nueva Dirección "No Pasar"
                    </h4>

                    {dncSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                        {dncSuccessMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[#6b6b6b] font-semibold">Dirección exacta *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Av. San Martín #450, Dpto 21"
                          value={newDncAddress}
                          onChange={(e) => setNewDncAddress(e.target.value)}
                          className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] placeholder-[#6b6b6b] focus:outline-none focus:border-[#5a6e5a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#6b6b6b] font-semibold">Cuadra / Letra</label>
                        <select
                          value={newDncBlock}
                          onChange={(e) => setNewDncBlock(e.target.value)}
                          className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                        >
                          {currentTerritory
                            ? currentTerritory.blocks.map((b) => (
                                <option key={b.id} value={b.letter}>
                                  Cuadra {b.letter}
                                </option>
                              ))
                            : ['A', 'B', 'C', 'D', 'E'].map((l) => (
                                <option key={l} value={l}>
                                  Cuadra {l}
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[#6b6b6b] font-semibold">Nombre residente (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ej: Sr. Pérez"
                          value={newDncResident}
                          onChange={(e) => setNewDncResident(e.target.value)}
                          className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] placeholder-[#6b6b6b] focus:outline-none focus:border-[#5a6e5a]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[#6b6b6b] font-semibold">Observación / Motivo</label>
                        <input
                          type="text"
                          placeholder="Ej: Solicitó expresamente no ser visitado"
                          value={newDncNotes}
                          onChange={(e) => setNewDncNotes(e.target.value)}
                          className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] placeholder-[#6b6b6b] focus:outline-none focus:border-[#5a6e5a]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#b57a58] hover:bg-[#9e694a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Ban className="w-4 h-4" /> Guardar No Pasar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
