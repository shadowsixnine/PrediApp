import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { S13Record, ScheduleItem, DoNotCallRecord } from '../types';

export function exportS13PDF(serviceYear: string, records: S13Record[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title & Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE ASIGNACIÓN DE TERRITORIO (S-13-S)', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Año de servicio: ${serviceYear}`, 14, 28);

  // AutoTable columns setup matching official S-13-S Form
  const head = [
    [
      { content: 'Núm.\nde terr.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Última fecha\nen que se\ncompletó*', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Asignado a', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Asignado a', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Asignado a', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Asignado a', colSpan: 2, styles: { halign: 'center' } },
    ],
    [
      { content: 'Fecha en que\nse asignó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse completó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse asignó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse completó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse asignó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse completó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse asignó', styles: { halign: 'center' } },
      { content: 'Fecha en que\nse completó', styles: { halign: 'center' } },
    ],
  ];

  const body = records.map((rec) => {
    const a0 = rec.assignments[0] || { assignedTo: '', dateAssigned: '', dateCompleted: '' };
    const a1 = rec.assignments[1] || { assignedTo: '', dateAssigned: '', dateCompleted: '' };
    const a2 = rec.assignments[2] || { assignedTo: '', dateAssigned: '', dateCompleted: '' };
    const a3 = rec.assignments[3] || { assignedTo: '', dateAssigned: '', dateCompleted: '' };

    return [
      rec.territoryNumber,
      rec.lastCompletedDate || '',
      a0.dateAssigned || '',
      a0.dateCompleted || '',
      a1.dateAssigned || '',
      a1.dateCompleted || '',
      a2.dateAssigned || '',
      a2.dateCompleted || '',
      a3.dateAssigned || '',
      a3.dateCompleted || '',
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: head as any,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
    },
  });

  // Footer note
  const finalY = (doc as any).lastAutoTable?.finalY || 260;
  doc.setFontSize(8);
  doc.text('*Cuando comience una nueva página, anote en esta columna la última fecha en que los territorios se completaron.', 14, finalY + 8);
  doc.text('S-13-S  1/22 - PrediApp Congregación', 14, finalY + 13);

  doc.save(`Registro_S13S_${serviceYear}.pdf`);
}

export function exportSchedulePDF(schedules: ScheduleItem[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAMA DE PREDICACIÓN PÚBLICA Y EN GRUPO', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} - PrediApp Congregación`, 14, 26);

  const head = [['Fecha', 'Día', 'Hora', 'Lugar de Encuentro / Dirección', 'Encargado', 'Territorio', 'Observaciones']];

  const sorted = [...schedules].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const body = sorted.map((s) => [
    s.date,
    s.dayOfWeek,
    s.time,
    `${s.meetingPointName}\n${s.address}`,
    s.conductorName,
    `Territorio #${s.territoryNumber}`,
    s.observations || '—',
  ]);

  autoTable(doc, {
    startY: 30,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [44, 54, 44],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  doc.save(`Programa_Predicacion_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportDoNotCallPDF(records: DoNotCallRecord[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO OFICIAL DE CASAS "NO PASAR"', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Congregación - Confidencial para Encargados | ${new Date().toLocaleDateString('es-ES')}`, 14, 26);

  const head = [['Territorio #', 'Cuadra', 'Dirección Exacta', 'Fecha Registro', 'Notas / Residente']];

  const body = records.map((r) => [
    `Territorio #${r.territoryNumber}`,
    r.blockLetter ? `Cuadra ${r.blockLetter}` : 'General',
    r.address,
    r.dateAdded || '—',
    `${r.notes}${r.residentName ? ` (${r.residentName})` : ''}`,
  ]);

  autoTable(doc, {
    startY: 30,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  doc.save(`Registro_NoPasar_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportBackupJSON(data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PrediApp_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
