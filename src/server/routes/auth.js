// =====================================================
// Route: /auth - OAuth2 para todas las plataformas
// =====================================================
'use strict';

const router = require('express').Router();
const logger = require('../../utils/logger');

// ── YouTube OAuth2 ────────────────────────────────
router.get('/youtube', (req, res) => {
  const orch = req.app.get('orchestrator');
  const url = orch.youtube.getAuthUrl();
  res.redirect(url);
});

router.get('/youtube/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Error: código no recibido');

  try {
    const orch = req.app.get('orchestrator');
    const tokens = await orch.youtube.exchangeCodeForToken(code);
    logger.info('YouTube autenticado');
    res.send(`
      <html>
      <head>
        <title>YouTube Conectado</title>
        <style>
          body { font-family: 'Inter', sans-serif; text-align: center; padding: 40px; background: #0f111a; color: #fff; }
          .card { background: #1a1c2e; padding: 30px; border-radius: 16px; display: inline-block; text-align: left; max-width: 600px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .token-box { margin-bottom: 20px; }
          label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
          .input-group { display: flex; gap: 10px; }
          input { flex: 1; background: #0f111a; border: 1px solid #334155; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; }
          button.copy { background: #334155; color: #fff; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
          button.copy:hover { background: #475569; }
          .btn-close { display: block; width: 100%; margin-top: 20px; background: #6366f1; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          h2 { margin-top: 0; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ YouTube Conectado</h2>
          <p style="margin-bottom: 25px; color: #94a3b8;">Copia estos valores en tu archivo <b>.env</b> y reinicia el servidor:</p>
          
          <div class="token-box">
            <label>YOUTUBE_ACCESS_TOKEN</label>
            <div class="input-group">
              <input type="text" id="access" value="${tokens.access_token}" readonly>
              <button class="copy" onclick="copy('access')">Copiar</button>
            </div>
          </div>

          <div class="token-box">
            <label>YOUTUBE_REFRESH_TOKEN</label>
            <div class="input-group">
              <input type="text" id="refresh" value="${tokens.refresh_token}" readonly>
              <button class="copy" onclick="copy('refresh')">Copiar</button>
            </div>
          </div>

          <button class="btn-close" onclick="window.close()">Cerrar Ventana</button>
        </div>

        <script>
          function copy(id) {
            const el = document.getElementById(id);
            el.select();
            document.execCommand('copy');
            const btn = el.nextElementSibling;
            const originalText = btn.innerText;
            btn.innerText = '¡Copiado!';
            btn.style.background = '#10b981';
            setTimeout(() => {
              btn.innerText = originalText;
              btn.style.background = '#334155';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// ── Facebook OAuth2 ───────────────────────────────
router.get('/facebook', (req, res) => {
  const orch = req.app.get('orchestrator');
  const url = orch.facebook.getAuthUrl();
  res.redirect(url);
});

router.get('/facebook/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Error: código no recibido');

  try {
    const orch = req.app.get('orchestrator');
    const data = await orch.facebook.exchangeCodeForToken(code);
    logger.info('Facebook autenticado');
    res.send(`
      <html>
      <head>
        <title>Facebook Conectado</title>
        <style>
          body { font-family: 'Inter', sans-serif; text-align: center; padding: 40px; background: #0f111a; color: #fff; }
          .card { background: #1a1c2e; padding: 30px; border-radius: 16px; display: inline-block; text-align: left; max-width: 600px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .token-box { margin-bottom: 20px; }
          label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
          .input-group { display: flex; gap: 10px; }
          input { flex: 1; background: #0f111a; border: 1px solid #334155; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; }
          button.copy { background: #334155; color: #fff; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
          button.copy:hover { background: #475569; }
          .btn-close { display: block; width: 100%; margin-top: 20px; background: #6366f1; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          h2 { margin-top: 0; color: #1877f2; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ Facebook Conectado</h2>
          <p style="margin-bottom: 25px; color: #94a3b8;">Copia este token en su variable correspondiente dentro del archivo <b>.env</b>:</p>
          
          <div class="token-box">
            <label>FACEBOOK_ACCESS_TOKEN</label>
            <div class="input-group">
              <input type="text" id="fb_token" value="${data.access_token}" readonly>
              <button class="copy" onclick="copy('fb_token')">Copiar</button>
            </div>
          </div>

          <button class="btn-close" onclick="window.close()">Cerrar Ventana</button>
        </div>

        <script>
          function copy(id) {
            const el = document.getElementById(id);
            el.select();
            document.execCommand('copy');
            const btn = el.nextElementSibling;
            const originalText = btn.innerText;
            btn.innerText = '¡Copiado!';
            btn.style.background = '#10b981';
            setTimeout(() => {
              btn.innerText = originalText;
              btn.style.background = '#334155';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// ── Restream OAuth2 ───────────────────────────────
router.get('/restream', (req, res) => {
  const orch = req.app.get('orchestrator');
  const url = orch.restream.getAuthUrl();
  res.redirect(url);
});

router.get('/restream/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Error: código no recibido');

  try {
    const orch = req.app.get('orchestrator');
    const data = await orch.restream.exchangeCodeForToken(code);
    logger.info('Restream autenticado');
    res.send(`
      <html>
      <head>
        <title>Restream Conectado</title>
        <style>
          body { font-family: 'Inter', sans-serif; text-align: center; padding: 40px; background: #0f111a; color: #fff; }
          .card { background: #1a1c2e; padding: 30px; border-radius: 16px; display: inline-block; text-align: left; max-width: 600px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .token-box { margin-bottom: 20px; }
          label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
          .input-group { display: flex; gap: 10px; }
          input { flex: 1; background: #0f111a; border: 1px solid #334155; color: #38bdf8; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; }
          button.copy { background: #334155; color: #fff; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
          button.copy:hover { background: #475569; }
          .btn-close { display: block; width: 100%; margin-top: 20px; background: #6366f1; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          h2 { margin-top: 0; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ Restream Conectado</h2>
          <p style="margin-bottom: 25px; color: #94a3b8;">Copia estos valores en tu archivo <b>.env</b>:</p>
          
          <div class="token-box">
            <label>RESTREAM_ACCESS_TOKEN</label>
            <div class="input-group">
              <input type="text" id="rs_access" value="${data.access_token}" readonly>
              <button class="copy" onclick="copy('rs_access')">Copiar</button>
            </div>
          </div>

          <div class="token-box">
            <label>RESTREAM_REFRESH_TOKEN</label>
            <div class="input-group">
              <input type="text" id="rs_refresh" value="${data.refresh_token}" readonly>
              <button class="copy" onclick="copy('rs_refresh')">Copiar</button>
            </div>
          </div>

          <button class="btn-close" onclick="window.close()">Cerrar Ventana</button>
        </div>

        <script>
          function copy(id) {
            const el = document.getElementById(id);
            el.select();
            document.execCommand('copy');
            const btn = el.nextElementSibling;
            const originalText = btn.innerText;
            btn.innerText = '¡Copiado!';
            btn.style.background = '#10b981';
            setTimeout(() => {
              btn.innerText = originalText;
              btn.style.background = '#334155';
            }, 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

module.exports = router;
