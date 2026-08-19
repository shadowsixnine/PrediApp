import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Layers,
  Edit3,
  Save,
  X,
  Lock,
  Trash2,
  MapPin,
  ShieldCheck,
  Crown,
  Key,
  RotateCcw,
  Tag,
  Eye,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Territory, DoNotCallRecord, UserRole, Block } from '../types';
import { parseKMLorKMZFile } from '../utils/kmlParser';

interface MapViewProps {
  territories: Territory[];
  doNotCallRecords: DoNotCallRecord[];
  initialSelectedTerritoryNumber?: string;
  userRole: UserRole;
  pins?: { encargadoPin: string; superintendentePin: string };
  onRoleChange?: (role: UserRole) => void;
  onCompleteTerritory: (
    territoryNumber: string,
    date: string,
    completedBlocks?: string[]
  ) => void;
  onAddDoNotCall: (record: Partial<DoNotCallRecord>) => void;
  onDeleteDoNotCall?: (id: string) => void;
  onKMLUploaded: (newTerritories: Territory[]) => void;
  onUpdateTerritory: (territory: Territory) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  territories,
  doNotCallRecords,
  initialSelectedTerritoryNumber,
  userRole,
  pins = { encargadoPin: '1234', superintendentePin: '1914' },
  onRoleChange,
  onCompleteTerritory,
  onAddDoNotCall,
  onDeleteDoNotCall,
  onKMLUploaded,
  onUpdateTerritory,
}) => {
  const isSuper = userRole === 'superintendente';
  const isEditable = userRole !== 'usuario';

  const [selectedTerritoryNumber, setSelectedTerritoryNumber] = useState<string>(
    initialSelectedTerritoryNumber || territories[0]?.number || '01'
  );

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // GPS geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string>('');
  const [geoSuccessMsg, setGeoSuccessMsg] = useState<string>('');
  const [userPannedAway, setUserPannedAway] = useState<boolean>(false);

  // Upload KML state
  const [isParsingKml, setIsParsingKml] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>('');

  // Add No Pasar Modal/Inline state
  const [showAddDnc, setShowAddDnc] = useState<boolean>(false);
  const [dncAddress, setDncAddress] = useState<string>('');
  const [dncBlockLetter, setDncBlockLetter] = useState<string>('A');
  const [dncNotes, setDncNotes] = useState<string>('');

  // Map Editing State
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [editTarget, setEditTarget] = useState<'territory' | 'block'>('block');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [clickInstruction, setClickInstruction] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Unlock Role Modal on Map page
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockPin, setUnlockPin] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  const currentTerritory =
    territories.find((t) => t.number === selectedTerritoryNumber) || territories[0];

  // Synchronize editing object when selected territory or territories change
  useEffect(() => {
    if (currentTerritory) {
      const cloned: Territory = JSON.parse(JSON.stringify(currentTerritory));
      setEditingTerritory(cloned);
      if (cloned.blocks && cloned.blocks.length > 0) {
        setSelectedBlockId(cloned.blocks[0].id);
      } else {
        setSelectedBlockId('');
      }
    }
  }, [selectedTerritoryNumber, territories]);

  // Handle Territory Switch -> Reset view
  const handleSelectTerritoryTab = (num: string) => {
    setSelectedTerritoryNumber(num);
    setUserPannedAway(false);
    const terr = territories.find((t) => t.number === num);
    if (terr && mapInstanceRef.current) {
      mapInstanceRef.current.setView(terr.center, 16);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = currentTerritory ? currentTerritory.center[0] : -33.4489;
      const initialLng = currentTerritory ? currentTerritory.center[1] : -70.6693;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Click Listener for OpenStreetMap editing (territory boundary or block boundary)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isEditMode || !editingTerritory) return;

      const { lat, lng } = e.latlng;

      if (editTarget === 'territory') {
        // Adding point to overall territory boundary
        const currentBoundary = editingTerritory.boundary || [];
        const updatedBoundary = [...currentBoundary, [lat, lng] as [number, number]];

        setEditingTerritory({
          ...editingTerritory,
          center: updatedBoundary.length === 1 ? [lat, lng] : editingTerritory.center,
          boundary: updatedBoundary,
        });

        setClickInstruction(
          `📍 Añadido punto a Límite General: (${lat.toFixed(5)}, ${lng.toFixed(5)}). Total puntos: ${updatedBoundary.length}`
        );
      } else if (editTarget === 'block') {
        // Adding point to specific block boundary
        if (!selectedBlockId) {
          setClickInstruction('⚠️ Selecciona o crea una Cuadra primero antes de hacer clic.');
          return;
        }

        const blockIdx = editingTerritory.blocks.findIndex((b) => b.id === selectedBlockId);
        if (blockIdx === -1) return;

        const targetBlock = editingTerritory.blocks[blockIdx];
        const currentCoords = targetBlock.coordinates || [];
        const updatedCoords = [...currentCoords, [lat, lng] as [number, number]];

        const updatedBlocks = [...editingTerritory.blocks];
        updatedBlocks[blockIdx] = {
          ...targetBlock,
          coordinates: updatedCoords,
        };

        setEditingTerritory({
          ...editingTerritory,
          blocks: updatedBlocks,
        });

        setClickInstruction(
          `🧱 Añadido punto a Cuadra ${targetBlock.letter}: (${lat.toFixed(5)}, ${lng.toFixed(5)}). Total puntos cuadra: ${updatedCoords.length}`
        );
      }
    };

    if (isEditMode) {
      map.on('click', handleMapClick);
    } else {
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isEditMode, editingTerritory, editTarget, selectedBlockId]);

  // Render Leaflet Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup || !currentTerritory) return;

    layersGroup.clearLayers();

    const activeTerr = isEditMode && editingTerritory ? editingTerritory : currentTerritory;

    // Render Territory Boundary Polygon if exists
    if (activeTerr.boundary && activeTerr.boundary.length > 2) {
      const boundaryPoly = L.polygon(activeTerr.boundary as L.LatLngExpression[], {
        color: activeTerr.completed ? '#5a6e5a' : '#b57a58',
        weight: isEditMode && editTarget === 'territory' ? 4 : 3,
        opacity: 0.9,
        dashArray: isEditMode && editTarget === 'territory' ? '6, 6' : undefined,
        fillColor: activeTerr.completed ? '#5a6e5a' : '#b57a58',
        fillOpacity: isEditMode ? 0.2 : 0.12,
      });
      boundaryPoly.bindPopup(
        `<b>Territorio ${activeTerr.number}</b><br/>${activeTerr.name}${
          isEditMode ? '<br/><em>Modo Edición Activo</em>' : ''
        }`
      );
      layersGroup.addLayer(boundaryPoly);

      // Render vertex markers for territory boundary when editing territory
      if (isEditMode && editTarget === 'territory' && activeTerr.boundary) {
        activeTerr.boundary.forEach((coord, idx) => {
          const vMarker = L.circleMarker(coord as L.LatLngExpression, {
            radius: 6,
            color: '#2c362c',
            fillColor: '#fbbf24',
            fillOpacity: 1,
            weight: 2,
          });
          vMarker.bindPopup(`Punto Límite General #${idx + 1}`);
          layersGroup.addLayer(vMarker);
        });
      }
    }

    // Render Blocks & Block Polygon Boundaries
    activeTerr.blocks.forEach((block) => {
      const isBlockSelected = isEditMode && editTarget === 'block' && block.id === selectedBlockId;
      let lat = activeTerr.center[0];
      let lng = activeTerr.center[1];

      if (block.coordinates && block.coordinates.length > 0) {
        // Calculate centroid of block coordinates
        lat = block.coordinates.reduce((acc, c) => acc + c[0], 0) / block.coordinates.length;
        lng = block.coordinates.reduce((acc, c) => acc + c[1], 0) / block.coordinates.length;

        const blockPoly = L.polygon(block.coordinates as L.LatLngExpression[], {
          color: isBlockSelected
            ? '#d97706' // Golden border for selected block being drawn
            : block.completed
            ? '#059669'
            : '#b57a58',
          weight: isBlockSelected ? 4 : 2,
          opacity: 0.9,
          dashArray: isBlockSelected ? '4, 4' : undefined,
          fillColor: isBlockSelected
            ? '#f59e0b'
            : block.completed
            ? '#10b981'
            : '#b57a58',
          fillOpacity: isBlockSelected ? 0.45 : 0.25,
        });

        blockPoly.bindPopup(
          `<b>Cuadra ${block.letter}</b><br/>${block.name}<br/>Estado: ${
            block.completed ? '✅ Completada' : '⏳ Pendiente'
          }<br/>Puntos: ${block.coordinates.length}`
        );
        layersGroup.addLayer(blockPoly);

        // If this block is currently selected for editing, render vertex markers for its coordinates
        if (isBlockSelected) {
          block.coordinates.forEach((coord, idx) => {
            const blockVMarker = L.circleMarker(coord as L.LatLngExpression, {
              radius: 6,
              color: '#92400e',
              fillColor: '#fef08a',
              fillOpacity: 1,
              weight: 2,
            });
            blockVMarker.bindPopup(`Cuadra ${block.letter} - Vértice #${idx + 1}`);
            layersGroup.addLayer(blockVMarker);
          });
        }
      } else {
        // Fallback offset if block coordinates not drawn yet
        const idx = activeTerr.blocks.indexOf(block);
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        lat = activeTerr.center[0] + (row - 0.5) * 0.0012;
        lng = activeTerr.center[1] + (col - 0.5) * 0.0015;
      }

      // Custom HTML Marker for Block Letter floating over centroid
      const customIcon = L.divIcon({
        className: 'custom-block-marker',
        html: `<div style="
          background-color: ${
            isBlockSelected
              ? '#d97706'
              : block.completed
              ? '#059669'
              : '#b57a58'
          };
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          border: 2px solid white;
          border-radius: 9999px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          transform: ${isBlockSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease;
        ">${block.letter}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #2a2a2a;">
          <strong>Cuadra ${block.letter}</strong><br/>
          ${block.name}<br/>
          <em>Estado: ${block.completed ? '✅ Completada' : '⏳ Pendiente'}</em>
        </div>
      `);
      layersGroup.addLayer(marker);
    });

    // Render Do Not Call pins for this territory
    const terrDnc = doNotCallRecords.filter((d) => d.territoryNumber === activeTerr.number);
    terrDnc.forEach((dnc, i) => {
      const dncLat = activeTerr.center[0] + (i + 1) * 0.0006 - 0.0003;
      const dncLng = activeTerr.center[1] - (i + 1) * 0.0005 + 0.0002;

      const dncIcon = L.divIcon({
        className: 'dnc-marker',
        html: `<div style="
          background-color: #dc2626;
          color: white;
          font-weight: 800;
          font-size: 11px;
          border: 2px solid white;
          border-radius: 8px;
          padding: 2px 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 4px;
        ">🚫 NO PASAR</div>`,
        iconSize: [90, 24],
        iconAnchor: [45, 12],
      });

      const dncMarker = L.marker([dncLat, dncLng], { icon: dncIcon });
      dncMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #991b1b;">
          <strong style="color: #dc2626;">🚫 DIRECCIÓN NO PASAR</strong><br/>
          <strong>${dnc.address}</strong><br/>
          Cuadra: ${dnc.blockLetter || 'Gral'}<br/>
          <em>${dnc.notes}</em>
        </div>
      `);
      layersGroup.addLayer(dncMarker);
    });

    // Render GPS user location marker if present
    if (userLocation) {
      if (userLocation.accuracy) {
        const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: userLocation.accuracy,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1,
        });
        layersGroup.addLayer(accuracyCircle);
      }

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `<div style="
          background-color: #2563eb;
          border: 3px solid white;
          border-radius: 9999px;
          width: 22px;
          height: 22px;
          box-shadow: 0 0 0 10px rgba(37, 99, 235, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background-color: white; border-radius: 9999px;"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      uMarker.bindPopup('<b>📍 Tu ubicación GPS actual en tiempo real</b>');
      layersGroup.addLayer(uMarker);
    }
  }, [
    selectedTerritoryNumber,
    currentTerritory,
    userLocation,
    doNotCallRecords,
    isEditMode,
    editingTerritory,
    editTarget,
    selectedBlockId,
  ]);

  // Robust Geolocation Handler
  const handleGeolocate = () => {
    setIsLocating(true);
    setGeoError('');
    setGeoSuccessMsg('');

    if (!('geolocation' in navigator)) {
      setGeoError('⚠️ Tu dispositivo o navegador no admite geolocalización GPS.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setIsLocating(false);
        setGeoSuccessMsg(`🎯 Ubicación GPS obtenida con éxito (precisión: ±${Math.round(pos.coords.accuracy || 10)}m)`);
        setUserPannedAway(true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 18, { animate: true });
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('⚠️ Permiso de ubicación denegado. Por favor concede permisos de ubicación a tu navegador.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('⚠️ La ubicación GPS no está disponible en este momento. Intenta al aire libre.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('⚠️ El GPS tardó demasiado en responder. Reintenta la búsqueda.');
        } else {
          setGeoError('⚠️ No se pudo obtener la geolocalización: ' + err.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleRecenterTerritory = () => {
    if (currentTerritory && mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentTerritory.center, 16, { animate: true });
      setUserPannedAway(false);
    }
  };

  // KML / KMZ Upload Handler
  const handleKmlUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingKml(true);
    setUploadMsg('');

    try {
      const parsed = await parseKMLorKMZFile(file);
      if (parsed.territories.length > 0) {
        onKMLUploaded(parsed.territories);
        setUploadMsg(
          `¡Cargados exitosamente ${parsed.territories.length} territorios (${parsed.rawPlacemarksCount} cuadras/elementos) desde ${file.name}!`
        );
        setSelectedTerritoryNumber(parsed.territories[0].number);
      } else {
        setUploadMsg('No se encontraron territorios válidos en el archivo KML/KMZ.');
      }
    } catch (err: any) {
      setUploadMsg('Error al procesar KML/KMZ: ' + (err.message || 'Formato no soportado.'));
    } finally {
      setIsParsingKml(false);
    }
  };

  // Block Completion Toggle
  const handleToggleBlockCompletion = (blockLetter: string) => {
    if (!isEditable) return;
    if (!currentTerritory) return;
    const currentCompleted = currentTerritory.blocks
      .filter((b) => b.completed)
      .map((b) => b.letter);

    let updated: string[] = [];
    if (currentCompleted.includes(blockLetter)) {
      updated = currentCompleted.filter((l) => l !== blockLetter);
    } else {
      updated = [...currentCompleted, blockLetter];
    }

    onCompleteTerritory(
      currentTerritory.number,
      new Date().toISOString().split('T')[0],
      updated
    );
  };

  // Add "No Pasar" address
  const handleAddDncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    if (!currentTerritory || !dncAddress.trim()) return;

    onAddDoNotCall({
      territoryNumber: currentTerritory.number,
      territoryId: currentTerritory.id,
      address: dncAddress.trim(),
      blockLetter: dncBlockLetter,
      notes: dncNotes.trim() || 'Ingresado desde mapa interactivo.',
    });

    setDncAddress('');
    setDncNotes('');
    setShowAddDnc(false);
  };

  // Map Editor Handlers
  const handleSaveTerritoryEdit = () => {
    if (!editingTerritory) return;
    onUpdateTerritory(editingTerritory);
    setSaveSuccessMsg('¡Territorio, cuadras y límites guardados exitosamente!');
    setTimeout(() => {
      setSaveSuccessMsg('');
      setIsEditMode(false);
      setClickInstruction('');
    }, 1500);
  };

  const handleClearTerritoryBoundary = () => {
    if (!editingTerritory) return;
    setEditingTerritory({
      ...editingTerritory,
      boundary: [],
    });
    setClickInstruction('Límite general borrado. Haz clic en el mapa para marcar nuevos puntos.');
  };

  // Add new block to editing territory
  const handleAddNewBlock = () => {
    if (!editingTerritory) return;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingLetters = editingTerritory.blocks.map((b) => b.letter);
    let nextLetter = 'A';
    for (let l of letters) {
      if (!existingLetters.includes(l)) {
        nextLetter = l;
        break;
      }
    }
    if (existingLetters.length >= 26) {
      nextLetter = `A${existingLetters.length + 1}`;
    }

    const newBlock: Block = {
      id: `b-${editingTerritory.number}-${nextLetter}-${Date.now()}`,
      letter: nextLetter,
      name: `Cuadra ${nextLetter}`,
      completed: false,
      coordinates: [],
    };

    const updatedBlocks = [...editingTerritory.blocks, newBlock];
    setEditingTerritory({
      ...editingTerritory,
      blocks: updatedBlocks,
    });
    setSelectedBlockId(newBlock.id);
    setEditTarget('block');
    setClickInstruction(`Cuadra ${nextLetter} creada. Haz clic en el mapa para dibujar su contorno.`);
  };

  // Delete currently selected block
  const handleDeleteSelectedBlock = () => {
    if (!editingTerritory || !selectedBlockId) return;
    const block = editingTerritory.blocks.find((b) => b.id === selectedBlockId);
    const updatedBlocks = editingTerritory.blocks.filter((b) => b.id !== selectedBlockId);
    setEditingTerritory({
      ...editingTerritory,
      blocks: updatedBlocks,
    });
    setSelectedBlockId(updatedBlocks[0]?.id || '');
    setClickInstruction(`Cuadra ${block?.letter || ''} eliminada.`);
  };

  // Clear boundary points of selected block
  const handleClearBlockBoundary = () => {
    if (!editingTerritory || !selectedBlockId) return;
    const blockIdx = editingTerritory.blocks.findIndex((b) => b.id === selectedBlockId);
    if (blockIdx === -1) return;

    const updatedBlocks = [...editingTerritory.blocks];
    updatedBlocks[blockIdx] = {
      ...updatedBlocks[blockIdx],
      coordinates: [],
    };

    setEditingTerritory({
      ...editingTerritory,
      blocks: updatedBlocks,
    });
    setClickInstruction(`Límites de la Cuadra ${updatedBlocks[blockIdx].letter} limpiados.`);
  };

  // Undo last coordinate point of selected block or territory
  const handleUndoLastPoint = () => {
    if (!editingTerritory) return;

    if (editTarget === 'territory') {
      const b = editingTerritory.boundary || [];
      if (b.length === 0) return;
      const nextB = b.slice(0, b.length - 1);
      setEditingTerritory({ ...editingTerritory, boundary: nextB });
      setClickInstruction(`Deshecho último punto de Límite General. Quedan: ${nextB.length}`);
    } else {
      if (!selectedBlockId) return;
      const idx = editingTerritory.blocks.findIndex((b) => b.id === selectedBlockId);
      if (idx === -1) return;
      const targetBlock = editingTerritory.blocks[idx];
      const coords = targetBlock.coordinates || [];
      if (coords.length === 0) return;

      const nextCoords = coords.slice(0, coords.length - 1);
      const updatedBlocks = [...editingTerritory.blocks];
      updatedBlocks[idx] = { ...targetBlock, coordinates: nextCoords };
      setEditingTerritory({ ...editingTerritory, blocks: updatedBlocks });
      setClickInstruction(`Deshecho último punto de la Cuadra ${targetBlock.letter}. Quedan: ${nextCoords.length}`);
    }
  };

  // Update selected block letter or name
  const handleUpdateBlockLetterOrName = (newLetter: string, newName: string) => {
    if (!editingTerritory || !selectedBlockId) return;
    const idx = editingTerritory.blocks.findIndex((b) => b.id === selectedBlockId);
    if (idx === -1) return;

    const updatedBlocks = [...editingTerritory.blocks];
    updatedBlocks[idx] = {
      ...updatedBlocks[idx],
      letter: newLetter.toUpperCase().trim() || 'A',
      name: newName,
    };

    setEditingTerritory({
      ...editingTerritory,
      blocks: updatedBlocks,
    });
  };

  // Verify PIN inside Map View
  const handleVerifyUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    const clean = unlockPin.trim();

    if (clean === pins.superintendentePin) {
      if (onRoleChange) onRoleChange('superintendente');
      setShowUnlockModal(false);
      setUnlockPin('');
      return;
    }

    if (clean === pins.encargadoPin) {
      if (onRoleChange) onRoleChange('encargado');
      setShowUnlockModal(false);
      setUnlockPin('');
      return;
    }

    setUnlockError('⚠️ PIN incorrecto. Verifica el código de acceso.');
  };

  const activeDncList = doNotCallRecords.filter(
    (d) => d.territoryNumber === currentTerritory?.number
  );

  const selectedBlockObj = editingTerritory?.blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="space-y-6">
      {/* Top Header & Selector Bar */}
      <div className="bg-[#2c362c] border border-[#212921] rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5a6e5a]/40 text-[#e8ede8] text-xs font-semibold border border-[#e8ede8]/20 mb-2">
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              Visor de Mapas y Límites de Cuadras (A, B, C...)
              {!isEditable ? (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded font-normal text-[10px] flex items-center gap-1 border border-amber-400/30">
                  <Lock className="w-3 h-3 text-amber-300" /> Modo Lectura
                </span>
              ) : (
                <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-200 rounded font-normal text-[10px] flex items-center gap-1 border border-emerald-400/30">
                  <Check className="w-3 h-3 text-emerald-300" /> Edición Habilitada
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-title font-normal tracking-wide text-[#e8ede8]">
              Mapas de Territorios de Predicación
            </h2>
            <p className="text-[#e8ede8]/80 text-xs sm:text-sm mt-1">
              Geolocalízate con el botón GPS, dibuja los límites exactos de cada cuadra (A, B, C...) y consulta alertas de "No Pasar".
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Read Only Banner Button to unlock edit */}
            {!isEditable && (
              <button
                onClick={() => {
                  setUnlockPin('');
                  setUnlockError('');
                  setShowUnlockModal(true);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-amber-400/40 shadow-xs transition"
              >
                <Key className="w-4 h-4 text-amber-200" />
                <span>Desbloquear Edición (PIN)</span>
              </button>
            )}

            {/* Map Edit Toggle Button for Authorized Users */}
            {isEditable && (
              <button
                onClick={() => {
                  const nextState = !isEditMode;
                  setIsEditMode(nextState);
                  if (nextState && currentTerritory) {
                    const cloned: Territory = JSON.parse(JSON.stringify(currentTerritory));
                    setEditingTerritory(cloned);
                    if (cloned.blocks && cloned.blocks.length > 0) {
                      setSelectedBlockId(cloned.blocks[0].id);
                    }
                    setClickInstruction('Selecciona una opción de edición y haz clic en el mapa para marcar vértices.');
                  }
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-sm ${
                  isEditMode
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-white/10 hover:bg-white/20 text-[#e8ede8] border border-white/20'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditMode ? 'Salir de Edición' : 'Editar Mapa y Cuadras'}</span>
              </button>
            )}

            {/* KML/KMZ File Upload Button */}
            {isSuper && (
              <label className="cursor-pointer px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#e8ede8] text-xs font-bold rounded-xl flex items-center gap-2 border border-white/20 transition backdrop-blur-sm">
                <Upload className="w-4 h-4 text-[#e8ede8]" />
                <span>{isParsingKml ? 'Cargando KML/KMZ...' : 'Adjuntar KML / KMZ'}</span>
                <input
                  type="file"
                  accept=".kml,.kmz"
                  onChange={handleKmlUploadChange}
                  disabled={isParsingKml}
                  className="hidden"
                />
              </label>
            )}

            {/* Geolocation GPS Button */}
            <button
              onClick={handleGeolocate}
              disabled={isLocating}
              className="px-3.5 py-2 bg-[#5a6e5a] hover:bg-[#465646] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition border border-emerald-400/30"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Ubicando...' : 'Geolocalizarme (GPS)'}</span>
            </button>

            {userPannedAway && (
              <button
                onClick={handleRecenterTerritory}
                className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-stone-500/40"
                title="Volver a enfocar en el centro del territorio actual"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>Centrar Territorio #{currentTerritory?.number}</span>
              </button>
            )}
          </div>
        </div>

        {uploadMsg && (
          <div className="p-3 bg-white/10 border border-white/20 text-[#e8ede8] text-xs rounded-xl font-medium">
            {uploadMsg}
          </div>
        )}

        {geoSuccessMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{geoSuccessMsg}</span>
          </div>
        )}

        {geoError && (
          <div className="p-3 bg-rose-900/40 border border-rose-500/40 text-rose-200 text-xs rounded-xl font-medium flex items-center justify-between">
            <span>{geoError}</span>
            <button
              onClick={() => setGeoError('')}
              className="text-rose-300 hover:text-white text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Territory Tabs Bar */}
        <div className="flex space-x-2 overflow-x-auto pb-1 pt-2 scrollbar-none border-t border-white/15">
          {territories.map((t) => {
            const isSelected = t.number === selectedTerritoryNumber;
            const hasDnc = doNotCallRecords.some((d) => d.territoryNumber === t.number);
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTerritoryTab(t.number)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#e8ede8] text-[#2c362c] border-[#d2ddd2] shadow-sm'
                    : 'bg-white/10 text-[#e8ede8] border-white/15 hover:bg-white/20'
                }`}
              >
                <span>Territorio #{t.number}</span>
                {hasDnc && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" title="Contiene No Pasar" />
                )}
                {t.completed ? (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-[#2c362c]' : 'text-emerald-300'}`}
                  />
                ) : (
                  <Clock
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-[#2c362c]' : 'text-stone-300'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* READ ONLY BENIGN NOTICE */}
      {!isEditable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              Estás en <strong>Modo de Solo Lectura</strong>. Puedes consultar el mapa y la lista de cuadras. Para marcar cuadras completadas o dibujar límites de cuadras, ingresa la clave PIN de Encargado.
            </span>
          </div>
          <button
            onClick={() => {
              setUnlockPin('');
              setUnlockError('');
              setShowUnlockModal(true);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap border border-amber-500/40 shadow-2xs self-start sm:self-auto"
          >
            Ingresar PIN
          </button>
        </div>
      )}

      {/* EDIT MODE CONTROL PANEL (DRAWING QUADRAS AND LETTERS) */}
      {isEditMode && editingTerritory && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 text-xs text-[#2a2a2a] shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Herramienta de Edición y Dibujo de Cuadras — Territorio #{editingTerritory.number}
                </h3>
                <p className="text-amber-800 text-[11px]">
                  Selecciona una opción abajo y haz clic directamente sobre el mapa de OpenStreetMap para marcar o delimitar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUndoLastPoint}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold transition flex items-center gap-1"
                title="Eliminar el último punto marcado en el mapa"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Deshacer Último Punto
              </button>
              <button
                onClick={handleSaveTerritoryEdit}
                className="px-4 py-1.5 bg-[#5a6e5a] hover:bg-[#465646] text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Guardar Cambios
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Edit Mode Tabs Selector: Territory Boundary vs Block Polygon Drawing */}
          <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 pb-2">
            <span className="font-bold text-amber-950 text-xs">Objetivo de Dibujo:</span>
            <button
              type="button"
              onClick={() => {
                setEditTarget('block');
                setClickInstruction('Modo Dibujar Cuadra: Selecciona una cuadra y haz clic en el mapa para delimitar su perímetro.');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                editTarget === 'block'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              🧱 Dibujar Límites de Cuadras (A, B, C...)
            </button>
            <button
              type="button"
              onClick={() => {
                setEditTarget('territory');
                setClickInstruction('Modo Límite General: Haz clic en el mapa para añadir vértices al perímetro general del territorio.');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                editTarget === 'territory'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              🗺️ Límite Exterior del Territorio
            </button>
          </div>

          {/* Sub Panel for Block Polygon Drawing */}
          {editTarget === 'block' && (
            <div className="bg-white p-4 rounded-xl border border-amber-300 space-y-3 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="font-bold text-gray-800 text-xs">Cuadra en edición:</label>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 font-bold text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {editingTerritory.blocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        Cuadra {b.letter} — {b.name} ({b.coordinates?.length || 0} pts)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddNewBlock}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nueva Cuadra
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearBlockBoundary}
                    disabled={!selectedBlockId}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold text-xs transition"
                    title="Borrar únicamente el contorno dibujado para esta cuadra"
                  >
                    🧹 Limpiar Puntos de esta Cuadra
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedBlock}
                    disabled={!selectedBlockId}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold text-xs transition flex items-center gap-1"
                    title="Eliminar esta cuadra por completo"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar Cuadra
                  </button>
                </div>
              </div>

              {/* Block Letter & Name Form Fields */}
              {selectedBlockObj && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Letra de la Cuadra:
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={selectedBlockObj.letter}
                      onChange={(e) =>
                        handleUpdateBlockLetterOrName(e.target.value, selectedBlockObj.name)
                      }
                      placeholder="Ej: A, B, C"
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 font-mono font-bold text-center text-sm text-gray-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nombre o Calle de la Cuadra:
                    </label>
                    <input
                      type="text"
                      value={selectedBlockObj.name}
                      onChange={(e) =>
                        handleUpdateBlockLetterOrName(selectedBlockObj.letter, e.target.value)
                      }
                      placeholder="Ej: Cuadra A - Calle Los Olivos #100-200"
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub Panel for General Territory Boundary */}
          {editTarget === 'territory' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-amber-300 shadow-2xs">
              <div>
                <label className="font-semibold text-gray-800 block mb-1">Nombre / Sector</label>
                <input
                  type="text"
                  value={editingTerritory.name}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-800 block mb-1">Zona Congregación</label>
                <input
                  type="text"
                  value={editingTerritory.zone}
                  onChange={(e) => setEditingTerritory({ ...editingTerritory, zone: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-gray-800">Límite Exterior</label>
                  <button
                    type="button"
                    onClick={handleClearTerritoryBoundary}
                    className="text-[11px] text-rose-700 hover:underline font-bold"
                  >
                    Borrar Límite General
                  </button>
                </div>
                <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                  {editingTerritory.boundary?.length || 0} puntos marcados en el perímetro general.
                </div>
              </div>
            </div>
          )}

          {clickInstruction && (
            <div className="p-2.5 bg-amber-100 border border-amber-300 text-amber-950 rounded-xl font-semibold text-xs flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>{clickInstruction}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Map + Side Alert & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Leaflet OpenStreetMap Container */}
        <div className="lg:col-span-2 bg-white border border-[#e0ddd7] rounded-2xl p-4 shadow-sm space-y-3 text-[#2a2a2a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-serif-title font-bold text-[#2c362c] text-sm">
                Mapa Interactivo — Territorio #{currentTerritory?.number}
              </span>
              <span className="text-[#6b6b6b]">({currentTerritory?.zone})</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Cuadra Lista
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b57a58]" /> Pendiente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> No Pasar
              </span>
            </div>
          </div>

          {/* Map canvas container */}
          <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-[#e0ddd7] bg-[#f8f6f2]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Overlay Badge */}
            <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-[#e0ddd7] text-xs shadow-md space-y-0.5">
              <span className="font-bold text-[#5a6e5a]">
                Territorio #{currentTerritory?.number}
              </span>
              <p className="text-[10px] text-[#6b6b6b] truncate max-w-[220px]">
                {currentTerritory?.name}
              </p>
              <div className="text-[10px] font-semibold text-emerald-800">
                {currentTerritory?.blocks.filter((b) => b.completed).length} / {currentTerritory?.blocks.length} cuadras completadas
              </div>
            </div>

            {/* Quick No Pasar Overlay Alert Badge on Map */}
            {activeDncList.length > 0 && (
              <div className="absolute bottom-3 left-3 z-20 bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>⚠️ {activeDncList.length} Dirección(es) "No Pasar"</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: "No Pasar" Alert Box + Block Controls */}
        <div className="space-y-4">
          {/* PROMINENT "ALERTA DE NO PASAR" SIDE CARD */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-3 text-[#2a2a2a] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-rose-950 text-sm">
                    Alerta "No Pasar"
                  </h3>
                  <p className="text-rose-800 text-[11px]">
                    Territorio #{currentTerritory?.number}
                  </p>
                </div>
              </div>

              {isEditable && (
                <button
                  onClick={() => setShowAddDnc(!showAddDnc)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar
                </button>
              )}
            </div>

            {showAddDnc && isEditable && (
              <form
                onSubmit={handleAddDncSubmit}
                className="bg-white p-3 rounded-xl border border-rose-200 space-y-2 text-xs shadow-sm"
              >
                <input
                  type="text"
                  required
                  placeholder="Dirección exacta *"
                  value={dncAddress}
                  onChange={(e) => setDncAddress(e.target.value)}
                  className="w-full bg-white border border-rose-300 rounded p-2 text-[#2a2a2a]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={dncBlockLetter}
                    onChange={(e) => setDncBlockLetter(e.target.value)}
                    className="bg-white border border-rose-300 rounded p-2 text-[#2a2a2a]"
                  >
                    {currentTerritory?.blocks.map((b) => (
                      <option key={b.id} value={b.letter}>
                        Cuadra {b.letter}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Motivo u Observación"
                    value={dncNotes}
                    onChange={(e) => setDncNotes(e.target.value)}
                    className="bg-white border border-rose-300 rounded p-2 text-[#2a2a2a]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-700 text-white font-bold rounded-lg hover:bg-rose-800 transition"
                >
                  Guardar Registro de No Pasar
                </button>
              </form>
            )}

            {/* List for current territory */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {activeDncList.map((dnc) => (
                <div
                  key={dnc.id}
                  className="p-3 bg-white rounded-xl border border-rose-200 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      {dnc.address}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-300">
                      Cuadra {dnc.blockLetter || 'A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700">{dnc.notes}</p>
                </div>
              ))}

              {activeDncList.length === 0 && (
                <div className="p-4 bg-white/60 rounded-xl text-center text-xs text-rose-800 italic">
                  No hay direcciones registradas como "No pasar" en este territorio.
                </div>
              )}
            </div>
          </div>

          {/* Blocks Control Card */}
          <div className="bg-white border border-[#e0ddd7] rounded-2xl p-5 shadow-sm space-y-4 text-[#2a2a2a]">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <div>
                <h3 className="font-serif-title font-bold text-[#2c362c] text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  Cuadras del Territorio
                </h3>
                <p className="text-[#6b6b6b] text-xs">
                  {!isEditable
                    ? 'Vista de cuadras y letras'
                    : 'Haz clic en una cuadra para marcar completada'}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-[#e8ede8] text-[#2c362c] font-bold rounded-lg text-xs border border-[#d2ddd2]">
                {currentTerritory?.blocks.filter((b) => b.completed).length} /{' '}
                {currentTerritory?.blocks.length}
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentTerritory?.blocks.map((block) => (
                <div
                  key={block.id}
                  onClick={() => isEditable && handleToggleBlockCompletion(block.letter)}
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${
                    !isEditable ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    block.completed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-[#f8f6f2] border-[#e0ddd7] hover:border-[#b5ac9d] text-[#2a2a2a]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        block.completed ? 'bg-emerald-600' : 'bg-[#b57a58]'
                      }`}
                    >
                      {block.letter}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-[#2a2a2a]">Cuadra {block.letter}</p>
                      <p className="text-[11px] text-[#6b6b6b] truncate max-w-[140px]">
                        {block.name}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold">
                    {block.completed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Listo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#6b6b6b]">
                        <Clock className="w-4 h-4" /> Pendiente
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Toggle Full Completion Button */}
            {isEditable && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (currentTerritory) {
                      onCompleteTerritory(
                        currentTerritory.number,
                        new Date().toISOString().split('T')[0]
                      );
                    }
                  }}
                  className="w-full py-2.5 bg-[#5a6e5a] hover:bg-[#465646] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar Todo el Territorio #
                  {currentTerritory?.number} Completado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UNLOCK ROLE MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs text-[#2a2a2a]">
          <div className="bg-white border border-[#e0ddd7] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e0ddd7] pb-3">
              <h3 className="font-serif-title font-bold text-[#2c362c] text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                Ingresar Clave PIN
              </h3>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-[#6b6b6b] hover:text-[#2a2a2a] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Ingresa la clave PIN de Encargado o Superintendente para habilitar la edición de mapas y cuadras:
            </p>

            <form onSubmit={handleVerifyUnlockPin} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value)}
                placeholder="Ej: 1234"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-center font-mono font-bold text-lg tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />

              {unlockError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
