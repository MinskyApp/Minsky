// =====================================================
// Route: /api/status - Estado del sistema (Fastify Plugin)
// =====================================================
'use strict';

const si = require('systeminformation');

async function statusRoutes(fastify, options) {
  // GET /api/status - Estado completo
  fastify.get('/', async (request, reply) => {
    try {
      const orchestrator = fastify.orchestrator;
      const [cpu, mem, net] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkStats(),
      ]);

      return {
        success: true,
        data: {
          stream: orchestrator.getStatus(),
          system: {
            cpu: Math.round(cpu.currentLoad),
            memory: Math.round((mem.used / mem.total) * 100),
            memoryUsed: Math.round(mem.used / 1024 / 1024),
            memoryTotal: Math.round(mem.total / 1024 / 1024),
            networkUpload: Math.round((net[0]?.tx_sec || 0) / 1024),
            networkDownload: Math.round((net[0]?.rx_sec || 0) / 1024),
          },
        },
      };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });

  // GET /api/status/precheck - Pre-stream check
  fastify.get('/precheck', async (request, reply) => {
    try {
      const preStreamCheck = require('../../utils/preStreamCheck');
      const results = await preStreamCheck.runAll();
      return { success: true, results };
    } catch (err) {
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}

module.exports = statusRoutes;
