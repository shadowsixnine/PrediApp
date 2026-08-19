import React, { useState } from 'react';
import {
  Ban,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Download,
  Lock,
} from 'lucide-react';
import { DoNotCallRecord, Territory, UserRole } from '../types';
import { exportDoNotCallPDF } from '../utils/pdfExporter';

interface DoNotCallViewProps {
  records: DoNotCallRecord[];
  territories: Territory[];
  userRole?: UserRole;
  onAddDoNotCall: (record: Partial<DoNotCallRecord>) => void;
  onDeleteDoNotCall: (id: string) => void;
}

export const DoNotCallView: React.FC<DoNotCallViewProps> = ({
  records,
  territories,
  userRole = 'usuario',
  onAddDoNotCall,
  onDeleteDoNotCall,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerritoryFilter, setSelectedTerritoryFilter] = useState('ALL');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTerritoryNumber, setFormTerritoryNumber] = useState('01');
  const [formAddress, setFormAddress] = useState('');
  const [formBlockLetter, setFormBlockLetter] = useState('A');
  const [formResidentName, setFormResidentName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddress.trim()) return;

    const terr = territories.find((t) => t.number === formTerritoryNumber);

    onAddDoNotCall({
      territoryNumber: formTerritoryNumber,
      territoryId: terr ? terr.id : 'terr-' + formTerritoryNumber,
      address: formAddress.trim(),
      blockLetter: formBlockLetter,
      residentName: formResidentName.trim() || undefined,
      notes: formNotes.trim() || 'Propietario solicitó no ser visitado.',
    });

    setSuccessMsg('¡Dirección de "No Pasar" guardada exitosamente!');
    setFormAddress('');
    setFormResidentName('');
    setFormNotes('');

    setTimeout(() => {
      setSuccessMsg('');
      setShowAddForm(false);
    }, 1500);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.territoryNumber.includes(searchTerm) ||
      (r.residentName && r.residentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTerr = selectedTerritoryFilter === 'ALL' || r.territoryNumber === selectedTerritoryFilter;

    return matchesSearch && matchesTerr;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#2c362c] border border-[#212921] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b57a58]/30 text-[#fbf3ee] text-xs font-semibold border border-[#b57a58]/40 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f2d9cb]" />
            Registro Oficial de "No Pasar"
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
            Direcciones Excluidas de Visitas
          </h2>
          <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
            Consulta y gestiona las direcciones donde los propietarios o residentes han solicitado no ser visitados por los publicadores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportDoNotCallPDF(filteredRecords)}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-[#e8ede8] font-bold text-xs rounded-xl flex items-center gap-2 border border-white/20 transition backdrop-blur-sm"
            title="Descargar PDF de lista No Pasar"
          >
            <Download className="w-4 h-4 text-emerald-300" /> Exportar PDF
          </button>

          {userRole !== 'usuario' ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2.5 bg-[#b57a58] hover:bg-[#9e694a] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Registrar Nueva Dirección
            </button>
          ) : (
            <div className="px-3 py-2 bg-black/20 text-stone-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-white/10">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Lectura (PIN requerido para editar)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-[#2a2a2a]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#6b6b6b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por calle, dirección, residente o nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#e0ddd7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2a2a2a] placeholder-[#6b6b6b] focus:outline-none focus:border-[#5a6e5a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6b6b6b]" />
          <select
            value={selectedTerritoryFilter}
            onChange={(e) => setSelectedTerritoryFilter(e.target.value)}
            className="bg-white border border-[#e0ddd7] rounded-xl px-3 py-2 text-xs text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
          >
            <option value="ALL">Todos los Territorios</option>
            {territories.map((t) => (
              <option key={t.id} value={t.number}>
                Territorio #{t.number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Records List Grid */}
      <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 shadow-sm space-y-4 text-[#2a2a2a]">
        <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
          <h3 className="text-sm font-serif-title font-bold text-[#2c362c] flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#b57a58]" />
            Lista de "No Pasar" ({filteredRecords.length})
          </h3>
          <span className="text-xs text-[#6b6b6b]">Pública y actualizada</span>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="text-xs text-[#6b6b6b] italic p-8 text-center">
            No se encontraron direcciones de "No Pasar" que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#fbf3ee] border border-[#f2d9cb] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded font-bold bg-[#e8ede8] text-[#2c362c] border border-[#d2ddd2] text-[11px]">
                      Territorio #{rec.territoryNumber}
                    </span>
                    {rec.blockLetter && (
                      <span className="px-2 py-0.5 rounded bg-white text-[#b57a58] border border-[#f2d9cb] font-mono text-[10px]">
                        Cuadra {rec.blockLetter}
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <p className="font-bold text-[#b57a58] text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#b57a58] shrink-0" />
                      {rec.address}
                    </p>
                    {rec.residentName && (
                      <p className="text-[#6b6b6b] text-xs mt-1">Residente: {rec.residentName}</p>
                    )}
                  </div>

                  <p className="text-[#2a2a2a] italic bg-white p-2.5 rounded-xl border border-[#f2d9cb]">
                    "{rec.notes}"
                  </p>
                </div>

                <div className="pt-2 border-t border-[#f2d9cb] flex items-center justify-between text-[10px] text-[#6b6b6b]">
                  <span>Registrado: {rec.dateAdded}</span>
                  {userRole !== 'usuario' && (
                    <button
                      onClick={() => onDeleteDoNotCall(rec.id)}
                      className="text-[#6b6b6b] hover:text-rose-700 p-1 transition"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD NO PASAR RECORD */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Ban className="w-5 h-5 text-[#b57a58]" /> Registrar Dirección "No Pasar"
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-[#6b6b6b] hover:text-[#2a2a2a]">✕</button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#6b6b6b] font-semibold block mb-1">Territorio *</label>
                    <select
                      value={formTerritoryNumber}
                      onChange={(e) => setFormTerritoryNumber(e.target.value)}
                      className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a] font-bold"
                    >
                      {territories.map((t) => (
                        <option key={t.id} value={t.number}>
                          Territorio #{t.number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#6b6b6b] font-semibold block mb-1">Cuadra / Letra</label>
                    <select
                      value={formBlockLetter}
                      onChange={(e) => setFormBlockLetter(e.target.value)}
                      className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F'].map((l) => (
                        <option key={l} value={l}>
                          Cuadra {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Dirección Exacta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Las Palmas #420, Dpto 101"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Nombre Residente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Familia Morales"
                    value={formResidentName}
                    onChange={(e) => setFormResidentName(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div>
                  <label className="text-[#6b6b6b] font-semibold block mb-1">Motivo / Observaciones</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: Solicitó expresamente no ser visitado por ninguna razón."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-white border border-[#e0ddd7] rounded-lg p-2 text-[#2a2a2a] focus:outline-none focus:border-[#5a6e5a]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-[#f8f6f2] border border-[#e0ddd7] text-[#2a2a2a] font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#b57a58] text-white font-bold rounded-xl hover:bg-[#9e694a] flex items-center gap-1.5 shadow-xs"
                  >
                    <Ban className="w-4 h-4" /> Guardar Registro
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
