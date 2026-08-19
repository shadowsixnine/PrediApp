import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initialTerritories,
  initialMeetingPoints,
  initialConductors,
  initialDoNotCallRecords,
  initialScheduleItems,
  initialConductorReports,
  initialS13Records,
} from './src/data/initialData.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory store initialized with default data
  let database = {
    territories: [...initialTerritories],
    meetingPoints: [...initialMeetingPoints],
    conductors: [...initialConductors],
    doNotCall: [...initialDoNotCallRecords],
    schedules: [...initialScheduleItems],
    reports: [...initialConductorReports],
    s13Records: [...initialS13Records],
    visitLogs: [] as any[],
  };

  // API Endpoints for congregation data synchronization
  app.get('/api/state', (req, res) => {
    res.json(database);
  });

  app.post('/api/state', (req, res) => {
    if (req.body && typeof req.body === 'object') {
      database = { ...database, ...req.body };
      res.json({ status: 'ok', message: 'Estado actualizado correctamente' });
    } else {
      res.status(400).json({ error: 'Formato de datos inválido' });
    }
  });

  app.get('/api/schedules', (req, res) => {
    res.json(database.schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const newSchedules = req.body;
    if (Array.isArray(newSchedules)) {
      database.schedules = newSchedules;
      res.json({ status: 'ok', schedules: database.schedules });
    } else {
      res.status(400).json({ error: 'Se esperaba una lista de programas' });
    }
  });

  app.post('/api/schedules/item', (req, res) => {
    const item = req.body;
    if (item && item.id) {
      const idx = database.schedules.findIndex((s) => s.id === item.id);
      if (idx >= 0) {
        database.schedules[idx] = item;
      } else {
        database.schedules.push(item);
      }
      res.json({ status: 'ok', item });
    } else {
      res.status(400).json({ error: 'Elemento inválido' });
    }
  });

  app.delete('/api/schedules/item/:id', (req, res) => {
    const { id } = req.params;
    database.schedules = database.schedules.filter((s) => s.id !== id);
    res.json({ status: 'ok' });
  });

  app.get('/api/territories', (req, res) => {
    res.json(database.territories);
  });

  app.post('/api/territories/complete', (req, res) => {
    const { territoryNumber, date, completedBlocks } = req.body;
    const terr = database.territories.find((t) => t.number === territoryNumber);
    if (terr) {
      if (completedBlocks && Array.isArray(completedBlocks)) {
        // Partial or specific blocks completed
        terr.blocks = terr.blocks.map((b) => {
          if (completedBlocks.includes(b.letter)) {
            return { ...b, completed: true, lastCompletedDate: date || new Date().toISOString().split('T')[0] };
          }
          return b;
        });
        // Check if all blocks are completed now
        const allDone = terr.blocks.every((b) => b.completed);
        if (allDone) {
          terr.completed = true;
          terr.lastCompletedDate = date || new Date().toISOString().split('T')[0];
        }
      } else {
        // Entire territory completed
        terr.completed = true;
        terr.lastCompletedDate = date || new Date().toISOString().split('T')[0];
        terr.blocks = terr.blocks.map((b) => ({
          ...b,
          completed: true,
          lastCompletedDate: date || new Date().toISOString().split('T')[0],
        }));
      }

      // Update S-13-S record
      const s13 = database.s13Records.find((s) => s.territoryNumber === territoryNumber);
      if (s13) {
        s13.lastCompletedDate = date || new Date().toISOString().split('T')[0];
        // find active assignment or update latest
        const activeIdx = s13.assignments.findIndex((a) => a.dateAssigned && !a.dateCompleted);
        if (activeIdx >= 0) {
          s13.assignments[activeIdx].dateCompleted = date || new Date().toISOString().split('T')[0];
        }
      }

      res.json({ status: 'ok', territory: terr });
    } else {
      res.status(404).json({ error: 'Territorio no encontrado' });
    }
  });

  app.post('/api/donotcall', (req, res) => {
    const record = req.body;
    if (record && record.address && record.territoryNumber) {
      const newRec = {
        id: 'dnc-' + Date.now(),
        dateAdded: new Date().toISOString().split('T')[0],
        ...record,
      };
      database.doNotCall.push(newRec);
      res.json({ status: 'ok', record: newRec });
    } else {
      res.status(400).json({ error: 'Dirección y territorio requeridos' });
    }
  });

  app.delete('/api/donotcall/:id', (req, res) => {
    const { id } = req.params;
    database.doNotCall = database.doNotCall.filter((d) => d.id !== id);
    res.json({ status: 'ok' });
  });

  app.post('/api/reports', (req, res) => {
    const report = req.body;
    if (report && report.subject) {
      const newReport = {
        id: 'rep-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        ...report,
      };
      database.reports.push(newReport);
      res.json({ status: 'ok', report: newReport });
    } else {
      res.status(400).json({ error: 'Asunto y contenido requeridos' });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
