// =====================================================
// Route: /api/obs - Control OBS (Fastify Plugin)
// =====================================================
'use strict';

async function obsRoutes(fastify, options) {
  // POST /api/obs/connect
  fastify.post('/connect', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      await orchestrator.connectOBS();
      return { success: true };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // POST /api/obs/disconnect
  fastify.post('/disconnect', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      await orchestrator.disconnectOBS();
      return { success: true };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // GET /api/obs/scenes
  fastify.get('/scenes', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      const scenes = await orchestrator.getSceneList();
      return { success: true, scenes };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // POST /api/obs/scene
  fastify.post('/scene', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const { scene } = request.body;
    if (!scene) {
      reply.status(400);
      return { success: false, error: 'scene requerido' };
    }
    try {
      await orchestrator.switchScene(scene);
      return { success: true, scene };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // GET /api/obs/audio
  fastify.get('/audio', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      const sources = await orchestrator.getAudioSources();
      return { success: true, sources };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // POST /api/obs/audio/mute
  fastify.post('/audio/mute', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const { source, muted } = request.body;
    try {
      await orchestrator.setAudioMute(source, muted);
      return { success: true };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // POST /api/obs/audio/volume
  fastify.post('/audio/volume', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const { source, volumeDb } = request.body;
    try {
      await orchestrator.setAudioVolume(source, volumeDb);
      return { success: true };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // GET /api/obs/stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      const stats = await orchestrator.obs.getStats();
      return { success: true, stats };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}

module.exports = obsRoutes;
