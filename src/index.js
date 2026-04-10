// MultiStream Pro - Main Entry Point (Fastify Edition)
'use strict';

require('dotenv').config();

// Configuración de Seguridad SSL
if (process.env.STRICT_SSL === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('ADVERTENCIA: Verificación SSL estricta desactivada (STRICT_SSL=0)');
}

const buildApp = require('./server/app');
const { initSocketIO } = require('./server/socket');
const logger = require('./utils/logger');
const { printBanner } = require('./utils/banner');
const StreamOrchestrator = require('./core/StreamOrchestrator');

const PORT = process.env.DASHBOARD_PORT || 3000;
const HOST = process.env.DASHBOARD_HOST || '0.0.0.0';

async function main() {
  printBanner(PORT);

  // 1. Construir Instancia Fastify
  const app = await buildApp();
  
  // 2. Inicializar Socket.IO (conectado al server de Fastify)
  const io = initSocketIO(app);

  // 3. Inicializar Orquestador
  const orchestrator = new StreamOrchestrator(io);
  
  // 4. Decorar app de Fastify para que las rutas tengan acceso
  app.decorate('orchestrator', orchestrator);
  app.decorate('io', io);

  // 5. Iniciar servidor Fastify
  try {
    const address = await app.listen({ port: PORT, host: HOST });
    logger.info(`Dashboard iniciado en ${address}`);
    logger.info(`Sistema de streaming listo`);
    
    // Intento de conexión inicial a OBS
    try {
      await orchestrator.connectOBS();
    } catch (err) {
      logger.warn('OBS no disponible al inicio. Puedes conectar desde el dashboard.');
    }
  } catch (err) {
    logger.error('Fallo al iniciar el servidor:', err);
    process.exit(1);
  }

  // Señales del sistema
  process.on('SIGTERM', () => shutdown(orchestrator, app));
  process.on('SIGINT', () => shutdown(orchestrator, app));
  
  process.on('uncaughtException', (err) => {
    logger.error('Error no capturado:', err);
    shutdown(orchestrator, app);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Promesa rechazada no manejada:', reason);
  });
}

async function shutdown(orchestrator, app) {
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

  try {
    await app.close();
    logger.info('Servidor Fastify cerrado correctamente');
  } catch (err) {
    logger.error('Error cerrando Fastify:', err.message);
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error('Error crítico al iniciar:', err);
  process.exit(1);
});
