// MultiStream Pro - Main Entry Point
'use strict';

require('dotenv').config();

// Configuración de Seguridad SSL
if (process.env.STRICT_SSL === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('ADVERTENCIA: Verificación SSL estricta desactivada (STRICT_SSL=0)');
}
const { createServer } = require('http');
const app = require('./server/app');
const { initSocketIO } = require('./server/socket');
const logger = require('./utils/logger');
const { printBanner } = require('./utils/banner');
const StreamOrchestrator = require('./core/StreamOrchestrator');
const preStreamCheck = require('./utils/preStreamCheck');

const PORT = process.env.DASHBOARD_PORT || 3000;
const HOST = process.env.DASHBOARD_HOST || '0.0.0.0';

async function main() {
  printBanner(PORT);

  // Servidor HTTP
  const httpServer = createServer(app);
  
  // Socket.IO
  const io = initSocketIO(httpServer);

  // Orquestador
  const orchestrator = new StreamOrchestrator(io);
  
  // Hacer el orquestador disponible globalmente en la app
  app.set('orchestrator', orchestrator);
  app.set('io', io);

  // Iniciar servidor
  httpServer.listen(PORT, HOST, async () => {
    logger.info(`Dashboard iniciado en http://${HOST}:${PORT}`);
    logger.info(`Sistema de streaming listo`);
    
    try {
      await orchestrator.connectOBS();
    } catch (err) {
      logger.warn('OBS no disponible al inicio. Puedes conectar desde el dashboard.');
    }
  });

  // Señales del sistema
  process.on('SIGTERM', () => shutdown(orchestrator, httpServer));
  process.on('SIGINT', () => shutdown(orchestrator, httpServer));
  
  process.on('uncaughtException', (err) => {
    logger.error('Error no capturado:', err);
    shutdown(orchestrator, httpServer);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Promesa rechazada no manejada:', reason);
  });
}

async function shutdown(orchestrator, server) {
  logger.info('Apagando MultiStream Pro...');
  
  try {
    // Detener stream si está activo
    if (orchestrator.isStreaming) {
      await orchestrator.stopStream();
    }
    await orchestrator.disconnect();
  } catch (err) {
    logger.error('Error durante apagado:', err.message);
  }

  server.close(() => {
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => process.exit(1), 10000);
}

main().catch((err) => {
  logger.error('Error crítico al iniciar:', err);
  process.exit(1);
});
