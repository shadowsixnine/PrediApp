import React, { useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  Eye,
  Plus,
  Home,
  HardDrive,
  Database,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { S13Record, Territory, UserRole, VisitLog } from '../types';
import { exportS13PDF, exportBackupJSON, importBackupJSON } from '../utils/pdfExporter';

interface RecordsViewProps {
  s13Records: S13Record[];
  territories: Territory[];
  visitLogs: VisitLog[];
  userRole?: UserRole;
  fullData?: any;
  onUpdateS13Record: (record: S13Record) => void;
  onAddVisitLog: (log: VisitLog) => void;
  onRestoreData?: (data: any) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  s13Records,
  territories,
  visitLogs,
  userRole = 'usuario',
  fullData,
  onUpdateS13Record,
  onAddVisitLog,
  onRestoreData,
}) => {
  const [serviceYear, setServiceYear] = useState('2026');
  const [showModelModal, setShowModelModal] = useState(false);
  const [customPdfName, setCustomPdfName] = useState<string | null>(null);
  const [customPdfUrl, setCustomPdfUrl] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState('');

  const handleExportBackup = () => {
    if (fullData) {
      exportBackupJSON(fullData);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreData) return;

    try {
      const data = await importBackupJSON(file);
      onRestoreData(data);
      setRestoreSuccess('¡Copia de respaldo restaurada exitosamente!');
      setTimeout(() => setRestoreSuccess(''), 3000);
    } catch (err: any) {
      alert('Error al restaurar respaldo: ' + (err.message || 'Archivo JSON no válido'));
    }
  };

  // Visit Logger Form State
  const [showVisitLogModal, setShowVisitLogModal] = useState(false);
  const [vTerrNum, setVTerrNum] = useState('01');
  const [vBlockLetter, setVBlockLetter] = useState('A');
  const [vAddress, setVAddress] = useState('');
  const [vStatus, setVStatus] = useState<'completado' | 'parcial' | 'no_en_casa' | 'revisita' | 'estudio' | 'no_pasar'>('completado');
  const [vPublisherName, setVPublisherName] = useState('');
  const [vNotes, setVNotes] = useState('');

  // Editing S-13-S Assignment Row State
  const [editingTerrNum, setEditingTerrNum] = useState<string | null>(null);
  const [assignName, setAssignName] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExportPdf = () => {
    exportS13PDF(serviceYear, s13Records);
  };

  const handlePdfUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomPdfName(file.name);
      const url = URL.createObjectURL(file);
      setCustomPdfUrl(url);
    }
  };

  const handleAddAssignment = (terrNum: string) => {
    const record = s13Records.find((s) => s.territoryNumber === terrNum);
    if (!record || !assignName.trim()) return;

    const newAssignments = [...record.assignments];
    const emptyIdx = newAssignments.findIndex((a) => !a.assignedTo);
    if (emptyIdx >= 0) {
      newAssignments[emptyIdx] = {
        assignedTo: assignName.trim(),
        dateAssigned: assignDate,
        dateCompleted: '',
      };
    } else {
      newAssignments.shift();
      newAssignments.push({
        assignedTo: assignName.trim(),
        dateAssigned: assignDate,
        dateCompleted: '',
      });
    }

    onUpdateS13Record({
      ...record,
      assignments: newAssignments as any,
    });

    setEditingTerrNum(null);
    setAssignName('');
  };

  const handleAddVisitLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vAddress.trim()) return;

    const newLog: VisitLog = {
      id: 'vlog-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      territoryNumber: vTerrNum,
      blockLetter: vBlockLetter,
      address: vAddress.trim(),
      status: vStatus,
      publisherName: vPublisherName.trim() || 'Publicador',
      notes: vNotes.trim() || undefined,
    };

    onAddVisitLog(newLog);
    setShowVisitLogModal(false);
    setVAddress('');
    setVNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#2c362c] border border-[#212921] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5a6e5a]/40 text-[#e8ede8] text-xs font-semibold border border-[#e8ede8]/20 mb-2">
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            Registro Oficial de Asignación de Territorio S-13-S
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
            Registros S-13-S y Visitas Realizadas
          </h2>
          <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
            Lleva el control de asignaciones según el formulario oficial S-13-S, sube o consulta el modelo en PDF y descarga informes oficiales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {fullData && (
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition backdrop-blur-xs"
              title="Descargar respaldo completo en formato JSON"
            >
              <HardDrive className="w-4 h-4 text-emerald-300" /> Respaldar JSON
            </button>
          )}

          {onRestoreData && (
            <label className="cursor-pointer px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition backdrop-blur-xs">
              <Database className="w-4 h-4 text-amber-300" /> Restaurar
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={() => setShowModelModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition backdrop-blur-xs"
          >
            <Eye className="w-4 h-4 text-[#e8ede8]" /> Modelo PDF S-13-S
          </button>

          <button
            onClick={() => setShowVisitLogModal(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition backdrop-blur-xs"
          >
            <Plus className="w-4 h-4 text-[#e8ede8]" /> Registrar Visita
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-[#5a6e5a] hover:bg-[#465646] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Exportar PDF S-13-S
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{restoreSuccess}</span>
        </div>
      )}

      {/* Official S-13-S Table Header Controls */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 shadow-sm space-y-4 text-[#2a2a2a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0ddd7] pb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-serif-title font-bold text-[#2c362c] text-base">Formulario S-13-S</h3>
            <div className="flex items-center gap-1.5 text-xs bg-[#f8f6f2] px-3 py-1 rounded-lg border border-[#e0ddd7]">
              <span className="text-[#6b6b6b]">Año de Servicio:</span>
              <input
                type="text"
                value={serviceYear}
                onChange={(e) => setServiceYear(e.target.value)}
                className="w-16 bg-transparent text-[#5a6e5a] font-bold focus:outline-none"
              />
            </div>
          </div>

          <span className="text-xs text-[#6b6b6b] italic">
            *Las fechas se actualizan automáticamente al marcar territorios completados.
          </span>
        </div>

        {/* S-13-S Interactive Grid Table matching Official JW S-13-S Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2c362c] text-[#e8ede8] text-center font-bold uppercase text-[10px] tracking-wider border-b border-[#212921]">
                <th className="p-2.5 border-r border-white/20 w-16" rowSpan={2}>
                  Núm.<br />de terr.
                </th>
                <th className="p-2.5 border-r border-white/20 w-28" rowSpan={2}>
                  Última fecha<br />en que se<br />completó*
                </th>
                <th className="p-2 border-r border-white/20" colSpan={2}>Asignado a (1)</th>
                <th className="p-2 border-r border-white/20" colSpan={2}>Asignado a (2)</th>
                <th className="p-2 border-r border-white/20" colSpan={2}>Asignado a (3)</th>
                <th className="p-2 border-r border-white/20" colSpan={2}>Asignado a (4)</th>
                <th className="p-2 w-20" rowSpan={2}>Acción</th>
              </tr>
              <tr className="bg-[#364236] text-[#e8ede8] text-center font-semibold text-[9px] border-b border-[#212921]">
                <th className="p-2 border-r border-white/20">Fecha Asignó</th>
                <th className="p-2 border-r border-white/20">Fecha Completó</th>
                <th className="p-2 border-r border-white/20">Fecha Asignó</th>
                <th className="p-2 border-r border-white/20">Fecha Completó</th>
                <th className="p-2 border-r border-white/20">Fecha Asignó</th>
                <th className="p-2 border-r border-white/20">Fecha Completó</th>
                <th className="p-2 border-r border-white/20">Fecha Asignó</th>
                <th className="p-2 border-r border-white/20">Fecha Completó</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0ddd7] text-[#2a2a2a]">
              {s13Records.map((rec) => (
                <tr key={rec.territoryNumber} className="hover:bg-[#f8f6f2] transition text-center">
                  <td className="p-2.5 border-r border-[#e0ddd7] font-bold text-[#5a6e5a] text-sm bg-[#f8f6f2]">
                    #{rec.territoryNumber}
                  </td>
                  <td className="p-2.5 border-r border-[#e0ddd7] font-mono text-[11px] text-[#2a2a2a] font-semibold bg-[#f8f6f2]/50">
                    {rec.lastCompletedDate || '—'}
                  </td>

                  {/* 4 Assignment Columns */}
                  {[0, 1, 2, 3].map((idx) => {
                    const assign = rec.assignments[idx] || { assignedTo: '', dateAssigned: '', dateCompleted: '' };
                    return (
                      <React.Fragment key={idx}>
                        <td className="p-2 border-r border-[#e0ddd7] text-[11px]">
                          {assign.assignedTo ? (
                            <div>
                              <span className="font-semibold text-[#2a2a2a] block truncate max-w-[90px]">{assign.assignedTo}</span>
                              <span className="text-[10px] text-[#6b6b6b] font-mono">{assign.dateAssigned}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-[#e0ddd7] text-[11px] font-mono text-emerald-700 font-semibold">
                          {assign.dateCompleted || '—'}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  <td className="p-2">
                    <button
                      onClick={() => setEditingTerrNum(rec.territoryNumber)}
                      className="px-2 py-1 bg-[#e8ede8] hover:bg-[#d2ddd2] text-[#2c362c] text-[10px] font-bold rounded border border-[#d2ddd2]"
                    >
                      + Asignar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* House-to-House Visit Logs Section */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 shadow-sm space-y-4 text-[#2a2a2a]">
        <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
          <h3 className="text-sm font-serif-title font-bold text-[#2c362c] flex items-center gap-2">
            <Home className="w-4 h-4 text-[#5a6e5a]" />
            Registro de Visitas y Casas en Predicación ({visitLogs.length})
          </h3>
          <span className="text-xs text-[#6b6b6b]">Historial de Casa en Casa</span>
        </div>

        {visitLogs.length === 0 ? (
          <p className="text-xs text-[#6b6b6b] italic p-6 text-center">
            No se han registrado visitas aún. Haz clic en "Registrar Visita" para guardar resultados de casa en casa.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visitLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2a2a2a]">{log.address}</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2]">
                    T-#{log.territoryNumber} ({log.blockLetter})
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6b6b6b]">
                  <span>Publicador: <strong className="text-[#2a2a2a]">{log.publisherName}</strong></span>
                  <span className="font-bold text-emerald-700 uppercase text-[10px]">{log.status}</span>
                </div>

                {log.notes && (
                  <p className="text-[#2a2a2a] italic text-[11px] pt-1">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW OR UPLOAD MODEL PDF */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5a6e5a]" /> Modelo Oficial S-13-S
              </h3>
              <button onClick={() => setShowModelModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            <div className="space-y-4 text-xs text-[#2a2a2a]">
              <div className="p-4 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] space-y-2">
                <p className="font-bold text-[#5a6e5a] text-sm">
                  REGISTRO DE ASIGNACIÓN DE TERRITORIO (S-13-S 1/22)
                </p>
                <p className="text-[#6b6b6b]">
                  El modelo integrado genera los reportes de asignación con el formato estándar de las congregaciones de los Testigos de Jehová, incluyendo años de servicio, número de territorio y las 4 columnas de asignación con fechas de inicio y término.
                </p>
              </div>

              {/* Upload Custom Model File */}
              <div className="p-4 bg-[#f8f6f2] rounded-xl border border-dashed border-[#e0ddd7] space-y-3 text-center">
                <p className="font-semibold text-[#2a2a2a]">
                  ¿Tienes un archivo PDF personalizado para reemplazar el modelo?
                </p>

                {customPdfName ? (
                  <p className="text-emerald-700 font-bold">📄 Archivo adjuntado: {customPdfName}</p>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#5a6e5a] hover:bg-[#465646] text-white font-bold rounded-xl cursor-pointer transition shadow-xs">
                    <Upload className="w-4 h-4" /> Subir PDF de Modelo
                    <input type="file" accept=".pdf" onChange={handlePdfUploadChange} className="hidden" />
                  </label>
                )}
              </div>

              {customPdfUrl && (
                <div className="h-64 rounded-xl overflow-hidden border border-[#e0ddd7]">
                  <iframe src={customPdfUrl} className="w-full h-full" title="Vista Previa PDF Modelo" />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowModelModal(false)}
                  className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TERRITORIO FORM */}
      {editingTerrNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-[#2a2a2a]">
            <h3 className="font-serif-title font-bold text-[#2c362c] text-sm border-b border-[#e0ddd7] pb-2">
              Asignar Territorio #{editingTerrNum} en S-13-S
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Nombre Hermano / Conductor *</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Fecha de Asignación *</label>
                <input
                  type="date"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditingTerrNum(null)}
                  className="px-3 py-1.5 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAddAssignment(editingTerrNum)}
                  className="px-3 py-1.5 bg-[#5a6e5a] text-white font-bold rounded hover:bg-[#465646]"
                >
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VISIT LOG FORM */}
      {showVisitLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base">Registrar Visita de Casa en Casa</h3>
              <button onClick={() => setShowVisitLogModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            <form onSubmit={handleAddVisitLogSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Territorio *</label>
                  <select
                    value={vTerrNum}
                    onChange={(e) => setVTerrNum(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    {territories.map((t) => (
                      <option key={t.id} value={t.number}>Territorio #{t.number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Cuadra *</label>
                  <select
                    value={vBlockLetter}
                    onChange={(e) => setVBlockLetter(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map((l) => (
                      <option key={l} value={l}>Cuadra {l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Dirección *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Calle Estado #210"
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Resultado de Visita *</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as any)}
                    className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    <option value="completado">Completado</option>
                    <option value="parcial">Parcial</option>
                    <option value="no_en_casa">No en casa</option>
                    <option value="revisita">Revisita</option>
                    <option value="estudio">Estudio Bíblico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Publicador</label>
                  <input
                    type="text"
                    placeholder="Ej: Hno. Silva"
                    value={vPublisherName}
                    onChange={(e) => setVPublisherName(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#6b6b6b] font-semibold block mb-1">Notas / Detalle</label>
                <input
                  type="text"
                  placeholder="Ej: Se dejó folleto / Volver el sábado"
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  className="w-full bg-white border border-[#e0ddd7] rounded p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitLogModal(false)}
                  className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5a6e5a] text-white font-bold rounded-xl hover:bg-[#465646] shadow-xs"
                >
                  Guardar Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
