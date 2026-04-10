// Socket.IO - Comunicacion en Tiempo Real
'use strict';

const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.debug(`Cliente conectado: ${socket.id}`);

    // Enviar estado actual al cliente que se conecta
    const app = require('./app');
    const orchestrator = app.get ? app.get('orchestrator') : null;
    if (orchestrator) {
      socket.emit('status:full', orchestrator.getStatus());
    }

    // Comandos
    socket.on('stream:start', async (options) => {
      try {
        const orch = require('./app').get('orchestrator');
        await orch.startStream(options);
      } catch (err) {
        socket.emit('stream:error', { error: err.message });
      }
    });

    socket.on('stream:stop', async () => {
      try {
        const orch = require('./app').get('orchestrator');
        await orch.stopStream();
      } catch (err) {
        socket.emit('stream:error', { error: err.message });
      }
    });

    socket.on('obs:connect', async () => {
      try {
        const orch = require('./app').get('orchestrator');
        await orch.connectOBS();
      } catch (err) {
        socket.emit('obs:error', { error: err.message });
      }
    });

    socket.on('scene:switch', async ({ scene }) => {
      try {
        const orch = require('./app').get('orchestrator');
        await orch.switchScene(scene);
      } catch (err) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('audio:mute', async ({ source, muted }) => {
      try {
        const orch = require('./app').get('orchestrator');
        await orch.setAudioMute(source, muted);
      } catch (err) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('preview:start', () => {
      try {
        const orch = require('./app').get('orchestrator');
        if (orch && orch.obs) orch.obs.startPreviewInterval(4); // 4 fps preview
      } catch (err) {
        logger.error('Error starting preview:', err.message);
      }
    });

    socket.on('preview:stop', () => {
      try {
        const orch = require('./app').get('orchestrator');
        if (orch && orch.obs) orch.obs.stopPreviewInterval();
      } catch (err) {
        logger.error('Error stopping preview:', err.message);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocketIO, getIO };
