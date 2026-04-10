// =====================================================
// Route: /api/stream - Control del Stream (Fastify Plugin)
// =====================================================
'use strict';

async function streamRoutes(fastify, options) {
  // POST /api/stream/start
  fastify.post('/start', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      const session = await orchestrator.startStream(request.body);
      return { success: true, session };
    } catch (err) {
      reply.status(400);
      return { success: false, error: err.message };
    }
  });

  // POST /api/stream/stop
  fastify.post('/stop', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      await orchestrator.stopStream();
      return { success: true };
    } catch (err) {
      reply.status(400);
      return { success: false, error: err.message };
    }
  });

  // GET /api/stream/status
  fastify.get('/status', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    return { success: true, data: orchestrator.getStatus() };
  });

  // POST /api/stream/reconnect
  fastify.post('/reconnect', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      await orchestrator.reconnect();
      return { success: true };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}

module.exports = streamRoutes;
