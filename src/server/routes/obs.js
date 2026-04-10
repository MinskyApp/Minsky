// =====================================================
// Route: /api/obs - Control OBS
// =====================================================
'use strict';

const router = require('express').Router();

function orch(req) { return req.app.get('orchestrator'); }

// POST /api/obs/connect
router.post('/connect', async (req, res) => {
  try {
    await orch(req).connectOBS();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/obs/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    await orch(req).disconnectOBS();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/obs/scenes
router.get('/scenes', async (req, res) => {
  try {
    const scenes = await orch(req).getSceneList();
    res.json({ success: true, scenes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/obs/scene
router.post('/scene', async (req, res) => {
  const { scene } = req.body;
  if (!scene) return res.status(400).json({ success: false, error: 'scene requerido' });
  try {
    await orch(req).switchScene(scene);
    res.json({ success: true, scene });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/obs/audio
router.get('/audio', async (req, res) => {
  try {
    const sources = await orch(req).getAudioSources();
    res.json({ success: true, sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/obs/audio/mute
router.post('/audio/mute', async (req, res) => {
  const { source, muted } = req.body;
  try {
    await orch(req).setAudioMute(source, muted);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/obs/audio/volume
router.post('/audio/volume', async (req, res) => {
  const { source, volumeDb } = req.body;
  try {
    await orch(req).setAudioVolume(source, volumeDb);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/obs/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await orch(req).obs.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
