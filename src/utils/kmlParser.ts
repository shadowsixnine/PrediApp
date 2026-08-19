import JSZip from 'jszip';
import { Territory, Block } from '../types';

export interface ParsedKMLResult {
  territories: Territory[];
  rawPlacemarksCount: number;
}

export async function parseKMLorKMZFile(file: File): Promise<ParsedKMLResult> {
  let xmlText = '';

  if (file.name.endsWith('.kmz')) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    let kmlFileName = Object.keys(contents.files).find((f) => f.endsWith('.kml'));
    if (!kmlFileName) {
      throw new Error('No se encontró ningún archivo .kml dentro del archivo .kmz');
    }
    xmlText = await contents.files[kmlFileName].async('text');
  } else {
    xmlText = await file.text();
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const territoriesMap = new Map<string, Territory>();
  let count = 0;

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const nameEl = placemark.getElementsByTagName('name')[0];
    const descEl = placemark.getElementsByTagName('description')[0];
    const name = nameEl ? nameEl.textContent?.trim() || '' : `Placemark ${i + 1}`;
    const description = descEl ? descEl.textContent?.trim() || '' : '';

    // Extract coordinates from Polygon or LineString or Point
    const coordEls = placemark.getElementsByTagName('coordinates');
    let coords: [number, number][] = [];

    if (coordEls.length > 0) {
      const rawText = coordEls[0].textContent?.trim() || '';
      const pairs = rawText.split(/\s+/);
      coords = pairs
        .map((p) => {
          const parts = p.split(',');
          if (parts.length >= 2) {
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return [lat, lng] as [number, number];
            }
          }
          return null;
        })
        .filter((c): c is [number, number] => c !== null);
    }

    if (coords.length === 0) continue;
    count++;

    // Calculate center
    const avgLat = coords.reduce((acc, curr) => acc + curr[0], 0) / coords.length;
    const avgLng = coords.reduce((acc, curr) => acc + curr[1], 0) / coords.length;
    const center: [number, number] = [avgLat, avgLng];

    // Determine territory number from name or description (e.g. "Territorio 06", "T06", "06", etc.)
    const terrMatch = name.match(/(?:Territorio|Terr|T)\s*[-_]?\s*(\d+)/i) || name.match(/^(\d{1,2})/);
    const terrNum = terrMatch ? terrMatch[1].padStart(2, '0') : String(territoriesMap.size + 10).padStart(2, '0');

    // Check if block letter exists (e.g. "Cuadra A", "Bloque B")
    const blockMatch = name.match(/(?:Cuadra|Bloque|Manzana|Q|C)\s*([A-Z])/i) || name.match(/\b([A-Z])\b/);
    const blockLetter = blockMatch ? blockMatch[1].toUpperCase() : 'A';

    if (!territoriesMap.has(terrNum)) {
      territoriesMap.set(terrNum, {
        id: `terr-${terrNum}-${Date.now()}`,
        number: terrNum,
        name: `Territorio ${terrNum} - ${name}`,
        zone: 'Cargado desde KML/KMZ',
        completed: false,
        center,
        boundary: coords.length > 2 ? coords : undefined,
        notes: description || 'Importado desde KML',
        blocks: [],
      });
    }

    const terr = territoriesMap.get(terrNum)!;
    
    // Add as block if polygon/linestring represents a block
    const blockId = `b-${terrNum}-${blockLetter}-${Date.now()}-${i}`;
    if (!terr.blocks.some((b) => b.letter === blockLetter)) {
      terr.blocks.push({
        id: blockId,
        letter: blockLetter,
        name: `Cuadra ${blockLetter} - ${name}`,
        completed: false,
        coordinates: coords,
      });
    }
  }

  // Ensure default A, B, C blocks if none extracted
  for (const terr of territoriesMap.values()) {
    if (terr.blocks.length === 0) {
      terr.blocks = [
        { id: `b-${terr.number}-A`, letter: 'A', name: 'Cuadra A', completed: false },
        { id: `b-${terr.number}-B`, letter: 'B', name: 'Cuadra B', completed: false },
        { id: `b-${terr.number}-C`, letter: 'C', name: 'Cuadra C', completed: false },
        { id: `b-${terr.number}-D`, letter: 'D', name: 'Cuadra D', completed: false },
      ];
    }
  }

  return {
    territories: Array.from(territoriesMap.values()),
    rawPlacemarksCount: count,
  };
}
