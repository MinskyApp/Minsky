// =====================================================
// Route: /api/stream - Control del Stream
// =====================================================
'use strict';

const router = require('express').Router();

function orchestrator(req) {
  return req.app.get('orchestrator');
}

// POST /api/stream/start
router.post('/start', async (req, res) => {
  try {
    const session = await orchestrator(req).startStream(req.body);
    res.json({ success: true, session });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/stream/stop
router.post('/stop', async (req, res) => {
  try {
    await orchestrator(req).stopStream();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/stream/status
router.get('/status', (req, res) => {
  res.json({ success: true, data: orchestrator(req).getStatus() });
});

// POST /api/stream/reconnect
router.post('/reconnect', async (req, res) => {
  try {
    await orchestrator(req).reconnect();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
