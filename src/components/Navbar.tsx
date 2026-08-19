import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Map,
  Users,
  Ban,
  FileText,
  Wifi,
  ShieldCheck,
  User,
  Crown,
  Download,
  Smartphone,
  Share2,
  Lock,
  Unlock,
  Key,
  Settings,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 'home' | 'programa' | 'mapas' | 'encargados' | 'nopasar' | 'registros';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  todayCount: number;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  pins: { encargadoPin: string; superintendentePin: string };
  onUpdatePins?: (newPins: { encargadoPin: string; superintendentePin: string }) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
  currentRole,
  onRoleChange,
  pins,
  onUpdatePins,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Security / Role Switch State
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetRole, setTargetRole] = useState<'encargado' | 'superintendente'>('encargado');
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showHelpPins, setShowHelpPins] = useState(false);

  // PIN Config Modal State
  const [showConfigPinsModal, setShowConfigPinsModal] = useState(false);
  const [editEncargadoPin, setEditEncargadoPin] = useState(pins.encargadoPin);
  const [editSuperintendentePin, setEditSuperintendentePin] = useState(pins.superintendentePin);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  useEffect(() => {
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleOpenUnlockModal = (role: 'encargado' | 'superintendente' = 'encargado') => {
    setTargetRole(role);
    setInputPin('');
    setPinError('');
    setShowHelpPins(false);
    setShowPinModal(true);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const cleanInput = inputPin.trim();

    if (cleanInput === pins.superintendentePin) {
      onRoleChange('superintendente');
      setShowPinModal(false);
      setInputPin('');
      return;
    }

    if (targetRole === 'encargado' && cleanInput === pins.encargadoPin) {
      onRoleChange('encargado');
      setShowPinModal(false);
      setInputPin('');
      return;
    }

    setPinError('⚠️ PIN incorrecto. Por favor verifica el código de acceso con el Superintendente de Servicio.');
  };

  const handleLockRole = () => {
    onRoleChange('usuario');
  };

  const handleSaveNewPins = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEncargadoPin.trim() || !editSuperintendentePin.trim()) return;

    if (onUpdatePins) {
      onUpdatePins({
        encargadoPin: editEncargadoPin.trim(),
        superintendentePin: editSuperintendentePin.trim(),
      });
      setConfigSuccessMsg('¡Claves PIN actualizadas correctamente para la congregación!');
      setTimeout(() => {
        setConfigSuccessMsg('');
        setShowConfigPinsModal(false);
      }, 2000);
    }
  };

  const tabs = [
    { id: 'home' as TabType, label: 'Pantalla principal', icon: Home, badge: todayCount > 0 ? todayCount : null },
    { id: 'programa' as TabType, label: 'Programa', icon: Calendar },
    { id: 'mapas' as TabType, label: 'Mapas', icon: Map },
    { id: 'encargados' as TabType, label: 'Encargados', icon: Users },
    { id: 'nopasar' as TabType, label: 'No pasar', icon: Ban },
    { id: 'registros' as TabType, label: 'Registros', icon: FileText },
  ];

  const roleInfo = {
    superintendente: {
      label: 'Superintendente de Servicio',
      shortLabel: 'Superintendente',
      icon: Crown,
      bg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      desc: 'Control Total y Edición Habilitada',
    },
    encargado: {
      label: 'Encargado del Grupo / Salida',
      shortLabel: 'Encargado',
      icon: ShieldCheck,
      bg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      desc: 'Marcar Cuadras y Salidas de Predicación',
    },
    usuario: {
      label: 'Usuario (Congregación)',
      shortLabel: 'Modo Lectura (Público)',
      icon: Lock,
      bg: 'bg-stone-500/30 text-stone-200 border-stone-400/30',
      desc: 'Acceso de Solo Lectura a Horarios y Mapas',
    },
  };

  const currentRoleObj = roleInfo[currentRole];
  const CurrentRoleIcon = currentRoleObj.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#2c362c] text-white border-b border-[#212921] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-2 border-b border-white/10 md:border-b-0">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 rounded-xl bg-[#5a6e5a]/30 border border-[#e8ede8]/20 flex items-center justify-center text-[#e8ede8] shadow-inner">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-serif-title font-normal tracking-wide text-[#e8ede8] leading-tight">
                  PrediApp Congregación
                </h1>
                <div className="flex items-center gap-2 text-xs text-stone-300">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Base de Datos en Línea
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-[#e8ede8]/80 font-mono text-[11px]">S-13-S</span>
                </div>
              </div>
            </div>

            {/* Mobile Access Lock Control */}
            <div className="md:hidden">
              {currentRole === 'usuario' ? (
                <button
                  onClick={() => handleOpenUnlockModal('encargado')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 border border-amber-400/40 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Acceso Encargados</span>
                </button>
              ) : (
                <button
                  onClick={handleLockRole}
                  className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1 border border-stone-500/40"
                  title="Bloquear y volver a Solo Lectura"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Bloquear</span>
                </button>
              )}
            </div>
          </div>

          {/* Right side: PWA Install, Sync indicator & Role Switcher */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-400/30 transition shadow-xs"
                title="Instalar PrediApp en el dispositivo o pantalla de inicio"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                <span>Instalar App</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2 text-xs bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Wifi className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-stone-200">Sincronizado</span>
              <span className="text-stone-400">|</span>
              <span className="text-[#e8ede8] font-medium capitalize">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            {/* Desktop Role Control */}
            <div className="hidden md:flex items-center gap-2 bg-[#1f281f] p-1.5 rounded-xl border border-white/15">
              {currentRole === 'usuario' ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/80 text-xs border border-stone-600/40">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-stone-300 font-semibold text-[11px]">Modo Lectura (Público)</span>
                  </div>
                  <button
                    onClick={() => handleOpenUnlockModal('encargado')}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 border border-emerald-400/30 transition shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Ingresar PIN de Encargado</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-xs border border-emerald-500/40">
                    <CurrentRoleIcon className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-100 font-bold text-[11px] capitalize">
                      {currentRole === 'superintendente' ? '👑 Superintendente' : '🛡️ Encargado'}
                    </span>
                  </div>

                  {currentRole === 'superintendente' && (
                    <button
                      onClick={() => {
                        setEditEncargadoPin(pins.encargadoPin);
                        setEditSuperintendentePin(pins.superintendentePin);
                        setShowConfigPinsModal(true);
                      }}
                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg border border-white/10 transition"
                      title="Configurar claves PIN de la congregación"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleLockRole}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-rose-900/80 text-stone-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1 border border-white/10 transition"
                    title="Cerrar modo de edición y volver a Solo Lectura"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                    <span>Bloquear</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Privileges Banner */}
        <div className="hidden sm:flex items-center justify-between text-[11px] py-1 text-stone-300 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${currentRoleObj.bg}`}>
              <CurrentRoleIcon className="w-3 h-3" />
              {currentRoleObj.shortLabel}
            </span>
            <span className="text-[#e8ede8]/90 font-medium">{currentRoleObj.desc}</span>
          </div>
          <span className="text-stone-400 italic">
            {currentRole === 'superintendente' && '⚡ Tienes control total: Administra Horarios, Territorios, PINs y S-13-S.'}
            {currentRole === 'encargado' && '✅ Edición Habilitada: Puedes agendar salidas, marcar territorios y subir reportes.'}
            {currentRole === 'usuario' && '🔒 Los usuarios consultan información. Para editar, ingresa con la Clave PIN de Encargado.'}
          </span>
        </div>

        {/* Dashboard Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2.5 scrollbar-none pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#e8ede8] text-[#2c362c] font-semibold shadow-sm border border-[#d2ddd2]'
                    : 'text-[#e8ede8]/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2c362c]' : 'text-[#e8ede8]/70'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#b57a58] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECURITY / PIN MODAL FOR UNLOCKING EDIT ROLE */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs text-[#2a2a2a]">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                Acceso a Modo Edición
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-[#6b6b6b] hover:text-[#2a2a2a] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Ingresa la clave PIN asignada para los Encargados o el Superintendente de Servicio de la congregación:
            </p>

            {/* Role Select Tabs in Modal */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => { setTargetRole('encargado'); setPinError(''); }}
                className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  targetRole === 'encargado'
                    ? 'bg-white text-emerald-800 shadow-xs border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Encargado
              </button>
              <button
                type="button"
                onClick={() => { setTargetRole('superintendente'); setPinError(''); }}
                className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  targetRole === 'superintendente'
                    ? 'bg-white text-amber-800 shadow-xs border border-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Superintendente
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Clave PIN ({targetRole === 'superintendente' ? 'Superintendente' : 'Encargado'}):
                </label>
                <input
                  type="password"
                  autoFocus
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Ej: 1234"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-center font-mono font-bold text-lg tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowHelpPins(!showHelpPins)}
                  className="text-[11px] text-emerald-800 hover:underline font-semibold"
                >
                  {showHelpPins ? 'Ocultar ayuda PIN' : '💡 ¿Claves iniciales?'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-xs"
                  >
                    Ingresar
                  </button>
                </div>
              </div>

              {showHelpPins && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] space-y-1">
                  <p className="font-bold">🔑 Claves PIN por defecto:</p>
                  <p>• <strong>Encargado de Grupo:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">1234</code></p>
                  <p>• <strong>Superintendente de Servicio:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">1914</code></p>
                  <p className="text-[10px] text-amber-800 italic pt-1">
                    (El Superintendente puede cambiar estos PINs desde la opción Configurar PINs).
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* PIN CONFIGURATION MODAL FOR SUPERINTENDENT */}
      {showConfigPinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs text-[#2a2a2a]">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-600" />
                Configurar PINs de la Congregación
              </h3>
              <button
                onClick={() => setShowConfigPinsModal(false)}
                className="text-[#6b6b6b] hover:text-[#2a2a2a] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Personaliza las claves de acceso de tu congregación. Estos PINs se sincronizan automáticamente con la base de datos en línea:
            </p>

            <form onSubmit={handleSaveNewPins} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PIN para Encargados de Grupo:
                </label>
                <input
                  type="text"
                  value={editEncargadoPin}
                  onChange={(e) => setEditEncargadoPin(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PIN para Superintendente de Servicio:
                </label>
                <input
                  type="text"
                  value={editSuperintendentePin}
                  onChange={(e) => setEditSuperintendentePin(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900"
                  required
                />
              </div>

              {configSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{configSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigPinsModal(false)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA INSTALLATION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs text-[#2a2a2a]">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-800" />
                Cómo Instalar PrediApp
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-[#6b6b6b] hover:text-[#2a2a2a] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Puedes instalar esta aplicación directamente en tu celular, tablet o computadora para abrirla como una App nativa sin navegador:
            </p>

            <div className="space-y-3 text-xs">
              {/* Android / Chrome */}
              <div className="p-3 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] space-y-1">
                <div className="font-bold text-[#2c362c] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  En Android / Chrome / Edge:
                </div>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                  <li>Toca el menú de 3 puntos (⋮) en la esquina superior del navegador.</li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.</li>
                  <li>Confirma para que aparezca el icono de PrediApp en tus aplicaciones.</li>
                </ol>
              </div>

              {/* iPhone / Safari */}
              <div className="p-3 bg-[#f8f6f2] rounded-xl border border-[#e0ddd7] space-y-1">
                <div className="font-bold text-[#2c362c] flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  En iPhone / iPad (Safari):
                </div>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                  <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba <Share2 className="w-3 h-3 inline text-blue-600" />).</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen).</li>
                  <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 bg-[#2c362c] hover:bg-[#1f281f] text-white font-bold text-xs rounded-xl transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


