// Fastify App - Servidor Web de Alto Rendimiento
'use strict';

const fastify = require('fastify')({
  logger: false // Usamos nuestro propio logger
});
const path = require('path');
const logger = require('../utils/logger');

// Plugins de Fastify
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const fastifyStatic = require('@fastify/static');

// Rutas (Plugins)
const streamRoutes = require('./routes/stream');
const obsRoutes   = require('./routes/obs');
const authRoutes  = require('./routes/auth');
const statusRoutes = require('./routes/status');

async function buildApp() {
  // Seguridad
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // desactivado para el dashboard
  });

  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ error: 'Demasiadas peticiones, intenta en un momento' })
  });

  // Logging Middleware (vía hook)
  fastify.addHook('onRequest', async (request, reply) => {
    logger.debug(`${request.method} ${request.url}`);
  });

  // Archivos estáticos
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../public'),
    prefix: '/', // raìz
  });

  // Registro de Rutas
  await fastify.register(streamRoutes, { prefix: '/api/stream' });
  await fastify.register(obsRoutes, { prefix: '/api/obs' });
  await fastify.register(statusRoutes, { prefix: '/api/status' });
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Dashboard fallback (SPA support)
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api')) {
      reply.status(404).send({ success: false, error: 'Ruta API no encontrada' });
    } else {
      reply.sendFile('index.html');
    }
  });

  // Error handler global
  fastify.setErrorHandler((error, request, reply) => {
    logger.error('API Error:', error.message);
    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  });

  return fastify;
}

module.exports = buildApp;
