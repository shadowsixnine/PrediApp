import React, { useState } from 'react';
import {
  Users,
  Phone,
  ShieldCheck,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Conductor, ConductorReport, Territory } from '../types';

interface ConductorsViewProps {
  conductors: Conductor[];
  reports: ConductorReport[];
  territories: Territory[];
  onAddReport: (report: Partial<ConductorReport>) => void;
}

export const ConductorsView: React.FC<ConductorsViewProps> = ({
  conductors,
  reports,
  territories,
  onAddReport,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedConductorId, setSelectedConductorId] = useState(conductors[0]?.id || '');
  const [reportType, setReportType] = useState<'asunto' | 'solicitud' | 'incidencia' | 'sugerencia'>('asunto');
  const [reportSubject, setReportSubject] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportTerritoryNumber, setReportTerritoryNumber] = useState('01');
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const cond = conductors.find((c) => c.id === selectedConductorId);
    if (!cond || !reportSubject.trim() || !reportDescription.trim()) return;

    onAddReport({
      conductorId: cond.id,
      conductorName: cond.name,
      type: reportType,
      subject: reportSubject.trim(),
      description: reportDescription.trim(),
      territoryNumber: reportTerritoryNumber,
    });

    setReportSuccessMsg('¡Reporte/Asunto enviado exitosamente a los encargados!');
    setReportSubject('');
    setReportDescription('');

    setTimeout(() => {
      setReportSuccessMsg('');
      setShowReportModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#2c362c] border border-[#212921] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5a6e5a]/40 text-[#e8ede8] text-xs font-semibold border border-[#e8ede8]/20 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            Supervisión y Encargados del Servicio
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
            Encargados y Labores de Predicación
          </h2>
          <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
            Consulta las responsabilidades de cada hermano encargado y envía reportes sobre asuntos necesarios para el buen funcionamiento de la predicación.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2.5 bg-[#5a6e5a] hover:bg-[#465646] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Reportar Asunto o Necesidad
        </button>
      </div>

      {/* Encargados Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-serif-title font-bold text-[#2c362c] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#5a6e5a]" />
          Lista de Encargados y sus Labores
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {conductors.map((conductor) => {
            const conductorReports = reports.filter((r) => r.conductorId === conductor.id);
            return (
              <div
                key={conductor.id}
                className="bg-white border border-[#e0ddd7] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 text-[#2a2a2a]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif-title font-bold text-[#2a2a2a] text-base">{conductor.name}</h4>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2] font-semibold text-xs mt-1">
                        {conductor.role}
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" title="Activo" />
                  </div>

                  <div className="mt-3 text-xs space-y-2 text-[#2a2a2a]">
                    <p className="flex items-center gap-2 text-[#6b6b6b]">
                      <Phone className="w-3.5 h-3.5 text-[#5a6e5a]" />
                      <span>{conductor.phone}</span>
                    </p>

                    <div className="p-3 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] space-y-1">
                      <span className="font-bold text-[#6b6b6b] text-[11px] block uppercase tracking-wider">
                        Labores Asignadas:
                      </span>
                      <p className="text-[#2a2a2a] leading-relaxed text-xs">{conductor.duties}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e0ddd7] flex items-center justify-between text-xs text-[#6b6b6b]">
                  <span>Reportes enviados: <strong className="text-[#5a6e5a]">{conductorReports.length}</strong></span>
                  <button
                    onClick={() => {
                      setSelectedConductorId(conductor.id);
                      setShowReportModal(true);
                    }}
                    className="text-[#5a6e5a] hover:underline font-semibold text-[11px]"
                  >
                    + Enviar Asunto
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports & Issues History */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 space-y-4 shadow-sm text-[#2a2a2a]">
        <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
          <h3 className="text-sm font-serif-title font-bold text-[#2c362c] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#5a6e5a]" />
            Asuntos y Reportes Registrados ({reports.length})
          </h3>
          <span className="text-xs text-[#6b6b6b]">Actualización en tiempo real</span>
        </div>

        {reports.length === 0 ? (
          <p className="text-xs text-[#6b6b6b] italic p-6 text-center">
            No hay asuntos o reportes registrados aún.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] text-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2] font-bold uppercase text-[10px]">
                      {rep.type}
                    </span>
                    <h4 className="font-bold text-[#2a2a2a] text-sm">{rep.subject}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#6b6b6b]">
                    <span>{rep.date}</span>
                    <span>•</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        rep.status === 'resuelto'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#fbf3ee] text-[#b57a58]'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                </div>

                <p className="text-[#2a2a2a] text-xs">{rep.description}</p>

                <div className="flex items-center justify-between text-[11px] text-[#6b6b6b] pt-1 border-t border-[#e0ddd7]">
                  <span>Encargado: <strong className="text-[#2a2a2a]">{rep.conductorName}</strong></span>
                  <span>Territorio #{rep.territoryNumber}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REPORT / ISSUE MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Send className="w-5 h-5 text-[#5a6e5a]" /> Reportar Asunto a los Encargados
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            {reportSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{reportSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Encargado Destinatario *</label>
                  <select
                    value={selectedConductorId}
                    onChange={(e) => setSelectedConductorId(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  >
                    {conductors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#6b6b6b] font-semibold block mb-1">Tipo de Asunto *</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                    >
                      <option value="asunto">Asunto General</option>
                      <option value="solicitud">Solicitud de Mapa</option>
                      <option value="incidencia">Incidencia en Predicación</option>
                      <option value="sugerencia">Sugerencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#6b6b6b] font-semibold block mb-1">Territorio Relacionado</label>
                    <select
                      value={reportTerritoryNumber}
                      onChange={(e) => setReportTerritoryNumber(e.target.value)}
                      className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                    >
                      {territories.map((t) => (
                        <option key={t.id} value={t.number}>Territorio #{t.number}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Asunto / Título *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Necesidad de nuevo mapa para sector comercial"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Descripción Detallada *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe los detalles del asunto u observación..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5a6e5a] text-white font-bold rounded-xl hover:bg-[#465646] shadow-xs"
                  >
                    Enviar Asunto
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
