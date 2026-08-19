import React, { useEffect, useState } from 'react';
import { subscribeToFirebaseData } from './lib/firebase';
import { Navbar, TabType } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ScheduleView } from './components/ScheduleView';
import { MapView } from './components/MapView';
import { ConductorsView } from './components/ConductorsView';
import { DoNotCallView } from './components/DoNotCallView';
import { RecordsView } from './components/RecordsView';
import {
  AppState,
  fetchState,
  saveState,
  markTerritoryCompletedApi,
  addDoNotCallApi,
  addReportApi,
} from './services/api';
import {
  initialTerritories,
  initialMeetingPoints,
  initialConductors,
  initialDoNotCallRecords,
  initialScheduleItems,
  initialConductorReports,
  initialS13Records,
} from './data/initialData';
import {
  Territory,
  MeetingPoint,
  Conductor,
  DoNotCallRecord,
  ScheduleItem,
  ConductorReport,
  S13Record,
  VisitLog,
  UserRole,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mapInitialTerritoryNumber, setMapInitialTerritoryNumber] = useState<string>('01');
  
  // User Role & Security PIN State (Defaults to 'usuario' / Read-Only for general visitors)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('prediapp_user_role');
    return (saved as UserRole) || 'usuario';
  });

  const [pins, setPins] = useState<{ encargadoPin: string; superintendentePin: string }>({
    encargadoPin: '1234',
    superintendentePin: '1914',
  });

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('prediapp_user_role', role);
  };

  const handleUpdatePins = (newPins: { encargadoPin: string; superintendentePin: string }) => {
    setPins(newPins);
    persist({ pins: newPins });
  };

  // State Management
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>(initialMeetingPoints);
  const [conductors, setConductors] = useState<Conductor[]>(initialConductors);
  const [doNotCall, setDoNotCall] = useState<DoNotCallRecord[]>(initialDoNotCallRecords);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialScheduleItems);
  const [reports, setReports] = useState<ConductorReport[]>(initialConductorReports);
  const [s13Records, setS13Records] = useState<S13Record[]>(initialS13Records);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);

  // Fetch initial state on mount & subscribe to Firestore updates
  useEffect(() => {
    async function init() {
      const state = await fetchState();
      if (state) {
        if (state.territories && state.territories.length > 0) setTerritories(state.territories);
        if (state.meetingPoints && state.meetingPoints.length > 0) setMeetingPoints(state.meetingPoints);
        if (state.conductors && state.conductors.length > 0) setConductors(state.conductors);
        if (state.doNotCall) setDoNotCall(state.doNotCall);
        if (state.schedules && state.schedules.length > 0) setSchedules(state.schedules);
        if (state.reports) setReports(state.reports);
        if (state.s13Records && state.s13Records.length > 0) setS13Records(state.s13Records);
        if (state.visitLogs) setVisitLogs(state.visitLogs);
        if (state.pins) setPins(state.pins);
      }
    }
    init();

    const unsubscribe = subscribeToFirebaseData((remoteState) => {
      if (remoteState) {
        if (remoteState.territories !== undefined) setTerritories(remoteState.territories);
        if (remoteState.meetingPoints !== undefined) setMeetingPoints(remoteState.meetingPoints);
        if (remoteState.conductors !== undefined) setConductors(remoteState.conductors);
        if (remoteState.doNotCall !== undefined) setDoNotCall(remoteState.doNotCall);
        if (remoteState.schedules !== undefined) setSchedules(remoteState.schedules);
        if (remoteState.reports !== undefined) setReports(remoteState.reports);
        if (remoteState.s13Records !== undefined) setS13Records(remoteState.s13Records);
        if (remoteState.visitLogs !== undefined) setVisitLogs(remoteState.visitLogs);
        if (remoteState.pins !== undefined) setPins(remoteState.pins);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state whenever changes occur
  const persist = (updated: Partial<AppState>) => {
    const fullState: AppState = {
      territories: updated.territories || territories,
      meetingPoints: updated.meetingPoints || meetingPoints,
      conductors: updated.conductors || conductors,
      doNotCall: updated.doNotCall || doNotCall,
      schedules: updated.schedules || schedules,
      reports: updated.reports || reports,
      s13Records: updated.s13Records || s13Records,
      visitLogs: updated.visitLogs || visitLogs,
      pins: updated.pins || pins,
    };
    saveState(fullState);
  };

  // Handler: Complete Territory or Blocks
  const handleCompleteTerritory = (
    territoryNumber: string,
    date: string,
    completedBlocks?: string[]
  ) => {
    const nextTerritories = territories.map((t) => {
      if (t.number === territoryNumber) {
        if (completedBlocks) {
          const updatedBlocks = t.blocks.map((b) => ({
            ...b,
            completed: completedBlocks.includes(b.letter),
            lastCompletedDate: completedBlocks.includes(b.letter) ? date : b.lastCompletedDate,
          }));
          const allDone = updatedBlocks.every((b) => b.completed);
          return {
            ...t,
            blocks: updatedBlocks,
            completed: allDone,
            lastCompletedDate: allDone ? date : t.lastCompletedDate,
          };
        } else {
          return {
            ...t,
            completed: true,
            lastCompletedDate: date,
            blocks: t.blocks.map((b) => ({ ...b, completed: true, lastCompletedDate: date })),
          };
        }
      }
      return t;
    });

    // Update S-13-S record
    const nextS13 = s13Records.map((s) => {
      if (s.territoryNumber === territoryNumber) {
        const assignments = [...s.assignments];
        const activeIdx = assignments.findIndex((a) => a.dateAssigned && !a.dateCompleted);
        if (activeIdx >= 0) {
          assignments[activeIdx] = { ...assignments[activeIdx], dateCompleted: date };
        }
        return {
          ...s,
          lastCompletedDate: date,
          assignments: assignments as any,
        };
      }
      return s;
    });

    setTerritories(nextTerritories);
    setS13Records(nextS13);
    persist({ territories: nextTerritories, s13Records: nextS13 });
    markTerritoryCompletedApi(territoryNumber, date, completedBlocks);
  };

  // Handler: Add Do Not Call Address
  const handleAddDoNotCall = (record: Partial<DoNotCallRecord>) => {
    const newRecord: DoNotCallRecord = {
      id: 'dnc-' + Date.now(),
      territoryId: record.territoryId || 'terr-' + record.territoryNumber,
      territoryNumber: record.territoryNumber || '01',
      address: record.address || 'Sin dirección',
      blockLetter: record.blockLetter || 'A',
      dateAdded: record.dateAdded || new Date().toISOString().split('T')[0],
      notes: record.notes || 'No pasar',
      residentName: record.residentName,
    };

    const nextDnc = [newRecord, ...doNotCall];
    setDoNotCall(nextDnc);
    persist({ doNotCall: nextDnc });
    addDoNotCallApi(newRecord);
  };

  // Handler: Delete Do Not Call Address
  const handleDeleteDoNotCall = (id: string) => {
    const nextDnc = doNotCall.filter((d) => d.id !== id);
    setDoNotCall(nextDnc);
    persist({ doNotCall: nextDnc });
  };

  // Handler: Restore Full JSON Data
  const handleRestoreFullData = (data: any) => {
    if (!data) return;
    if (data.territories) setTerritories(data.territories);
    if (data.meetingPoints) setMeetingPoints(data.meetingPoints);
    if (data.conductors) setConductors(data.conductors);
    if (data.schedules) setSchedules(data.schedules);
    if (data.doNotCall) setDoNotCall(data.doNotCall);
    if (data.conductorReports) setReports(data.conductorReports);
    if (data.s13Records) setS13Records(data.s13Records);
    if (data.visitLogs) setVisitLogs(data.visitLogs);
    persist(data);
  };

  // Handler: Save Schedule Item
  const handleSaveScheduleItem = (item: ScheduleItem) => {
    const idx = schedules.findIndex((s) => s.id === item.id);
    let nextSchedules: ScheduleItem[] = [];
    if (idx >= 0) {
      nextSchedules = [...schedules];
      nextSchedules[idx] = item;
    } else {
      nextSchedules = [item, ...schedules];
    }
    setSchedules(nextSchedules);
    persist({ schedules: nextSchedules });
  };

  // Handler: Delete Schedule Item
  const handleDeleteScheduleItem = (id: string) => {
    const nextSchedules = schedules.filter((s) => s.id !== id);
    setSchedules(nextSchedules);
    persist({ schedules: nextSchedules });
  };

  // Handler: Batch 15-day Program Generator
  const handleGenerate15DayProgram = (newSchedules: ScheduleItem[]) => {
    setSchedules(newSchedules);
    persist({ schedules: newSchedules });
  };

  // Handlers for Master Data
  const handleAddMeetingPoint = (mp: MeetingPoint) => {
    const nextMps = [...meetingPoints, mp];
    setMeetingPoints(nextMps);
    persist({ meetingPoints: nextMps });
  };

  const handleUpdateMeetingPoint = (mp: MeetingPoint) => {
    const nextMps = meetingPoints.map((m) => (m.id === mp.id ? mp : m));
    setMeetingPoints(nextMps);
    persist({ meetingPoints: nextMps });
  };

  const handleDeleteMeetingPoint = (id: string) => {
    const nextMps = meetingPoints.filter((m) => m.id !== id);
    setMeetingPoints(nextMps);
    persist({ meetingPoints: nextMps });
  };

  const handleAddConductor = (c: Conductor) => {
    const nextConds = [...conductors, c];
    setConductors(nextConds);
    persist({ conductors: nextConds });
  };

  const handleUpdateConductor = (c: Conductor) => {
    const nextConds = conductors.map((item) => (item.id === c.id ? c : item));
    setConductors(nextConds);
    persist({ conductors: nextConds });
  };

  const handleDeleteConductor = (id: string) => {
    const nextConds = conductors.filter((c) => c.id !== id);
    setConductors(nextConds);
    persist({ conductors: nextConds });
  };

  const handleAddTerritory = (t: Territory) => {
    const nextTerrs = [...territories, t];
    // Also add to S-13-S
    const nextS13 = [
      ...s13Records,
      {
        territoryNumber: t.number,
        lastCompletedDate: '',
        assignments: [
          { assignedTo: '', dateAssigned: '', dateCompleted: '' },
          { assignedTo: '', dateAssigned: '', dateCompleted: '' },
          { assignedTo: '', dateAssigned: '', dateCompleted: '' },
          { assignedTo: '', dateAssigned: '', dateCompleted: '' },
        ] as any,
      },
    ];

    setTerritories(nextTerrs);
    setS13Records(nextS13);
    persist({ territories: nextTerrs, s13Records: nextS13 });
  };

  const handleUpdateTerritory = (t: Territory) => {
    const nextTerrs = territories.map((item) => (item.id === t.id || item.number === t.number ? t : item));
    setTerritories(nextTerrs);
    persist({ territories: nextTerrs });
  };

  const handleDeleteTerritory = (id: string) => {
    const nextTerrs = territories.filter((t) => t.id !== id);
    setTerritories(nextTerrs);
    persist({ territories: nextTerrs });
  };

  // Handler: KML/KMZ Uploaded
  const handleKMLUploaded = (newTerrs: Territory[]) => {
    // Merge without duplicates
    const merged = [...territories];
    newTerrs.forEach((nt) => {
      const idx = merged.findIndex((m) => m.number === nt.number);
      if (idx >= 0) {
        merged[idx] = nt;
      } else {
        merged.push(nt);
      }
    });

    setTerritories(merged);
    persist({ territories: merged });
  };

  // Handler: Add Conductor Report
  const handleAddReport = (report: Partial<ConductorReport>) => {
    const newRep: ConductorReport = {
      id: 'rep-' + Date.now(),
      conductorId: report.conductorId || 'cond-1',
      conductorName: report.conductorName || 'Encargado',
      date: new Date().toISOString().split('T')[0],
      type: report.type || 'asunto',
      subject: report.subject || 'Sin asunto',
      description: report.description || '',
      status: 'pendiente',
      territoryNumber: report.territoryNumber,
    };

    const nextReports = [newRep, ...reports];
    setReports(nextReports);
    persist({ reports: nextReports });
    addReportApi(newRep);
  };

  // Handler: Update S-13-S Record
  const handleUpdateS13Record = (rec: S13Record) => {
    const nextS13 = s13Records.map((s) => (s.territoryNumber === rec.territoryNumber ? rec : s));
    setS13Records(nextS13);
    persist({ s13Records: nextS13 });
  };

  // Handler: Add Visit Log
  const handleAddVisitLog = (vlog: VisitLog) => {
    const nextLogs = [vlog, ...visitLogs];
    setVisitLogs(nextLogs);
    persist({ visitLogs: nextLogs });
  };

  // Navigate directly to Map tab with a specific territory
  const handleNavigateToMap = (terrNumber: string) => {
    setMapInitialTerritoryNumber(terrNumber);
    setActiveTab('mapas');
  };

  // Count today's schedule items
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedulesCount = schedules.filter((s) => s.date === todayStr).length;

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#2a2a2a] font-sans antialiased flex flex-col selection:bg-[#5a6e5a] selection:text-white">
      {/* Navigation Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayCount={todaySchedulesCount}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        pins={pins}
        onUpdatePins={handleUpdatePins}
      />

      {/* Dashboard Main Canvas Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeView
            schedules={schedules}
            territories={territories}
            doNotCallRecords={doNotCall}
            meetingPoints={meetingPoints}
            conductors={conductors}
            onCompleteTerritory={handleCompleteTerritory}
            onAddDoNotCall={handleAddDoNotCall}
            onNavigateToMap={handleNavigateToMap}
          />
        )}

        {activeTab === 'programa' && (
          <ScheduleView
            schedules={schedules}
            meetingPoints={meetingPoints}
            conductors={conductors}
            territories={territories}
            userRole={currentRole}
            onSaveScheduleItem={handleSaveScheduleItem}
            onDeleteScheduleItem={handleDeleteScheduleItem}
            onGenerate15DayProgram={handleGenerate15DayProgram}
            onAddMeetingPoint={handleAddMeetingPoint}
            onUpdateMeetingPoint={handleUpdateMeetingPoint}
            onDeleteMeetingPoint={handleDeleteMeetingPoint}
            onAddConductor={handleAddConductor}
            onUpdateConductor={handleUpdateConductor}
            onDeleteConductor={handleDeleteConductor}
            onAddTerritory={handleAddTerritory}
            onUpdateTerritory={handleUpdateTerritory}
            onDeleteTerritory={handleDeleteTerritory}
          />
        )}

        {activeTab === 'mapas' && (
          <MapView
            territories={territories}
            doNotCallRecords={doNotCall}
            initialSelectedTerritoryNumber={mapInitialTerritoryNumber}
            userRole={currentRole}
            pins={pins}
            onRoleChange={handleRoleChange}
            onCompleteTerritory={handleCompleteTerritory}
            onAddDoNotCall={handleAddDoNotCall}
            onDeleteDoNotCall={handleDeleteDoNotCall}
            onKMLUploaded={handleKMLUploaded}
            onUpdateTerritory={handleUpdateTerritory}
          />
        )}

        {activeTab === 'encargados' && (
          <ConductorsView
            conductors={conductors}
            reports={reports}
            territories={territories}
            userRole={currentRole}
            onAddReport={handleAddReport}
          />
        )}

        {activeTab === 'nopasar' && (
          <DoNotCallView
            records={doNotCall}
            territories={territories}
            userRole={currentRole}
            onAddDoNotCall={handleAddDoNotCall}
            onDeleteDoNotCall={handleDeleteDoNotCall}
          />
        )}

        {activeTab === 'registros' && (
          <RecordsView
            s13Records={s13Records}
            territories={territories}
            visitLogs={visitLogs}
            userRole={currentRole}
            fullData={{
              territories,
              meetingPoints,
              conductors,
              schedules,
              doNotCall,
              conductorReports: reports,
              s13Records,
              visitLogs,
            }}
            onUpdateS13Record={handleUpdateS13Record}
            onAddVisitLog={handleAddVisitLog}
            onRestoreData={handleRestoreFullData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#2c362c] text-stone-300 border-t border-[#232b23] py-4 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Gestión de Territorios de Predicación • Testigos de Jehová</span>
          <span className="text-[#e8ede8] opacity-80">Formulario S-13-S • Sincronización en Línea</span>
        </div>
      </footer>
    </div>
  );
}
