// =====================================================
// Route: /api/status - Estado del sistema
// =====================================================
'use strict';

const router = require('express').Router();
const si = require('systeminformation');

// GET /api/status - Estado completo
router.get('/', async (req, res) => {
  try {
    const orchestrator = req.app.get('orchestrator');
    const [cpu, mem, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
    ]);

    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/status/precheck - Pre-stream check
router.get('/precheck', async (req, res) => {
  try {
    const preStreamCheck = require('../../utils/preStreamCheck');
    const results = await preStreamCheck.runAll();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
