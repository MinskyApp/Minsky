// =====================================================
// Route: /auth - OAuth2 para todas las plataformas (Fastify Plugin)
// =====================================================
'use strict';

const logger = require('../../utils/logger');

async function authRoutes(fastify, options) {
  // ── YouTube OAuth2 ────────────────────────────────
  fastify.get('/youtube', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const url = orchestrator.youtube.getAuthUrl();
    reply.redirect(url);
  });

  fastify.get('/youtube/callback', async (request, reply) => {
    const { code } = request.query;
    if (!code) {
      reply.status(400);
      return 'Error: código no recibido';
    }

    try {
      const orchestrator = fastify.orchestrator;
      const tokens = await orchestrator.youtube.exchangeCodeForToken(code);
      logger.info('YouTube autenticado');
      reply.type('text/html').send(`
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
      reply.status(500);
      return `Error: ${err.message}`;
    }
  });

  // ── Facebook OAuth2 ───────────────────────────────
  fastify.get('/facebook', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const url = orchestrator.facebook.getAuthUrl();
    reply.redirect(url);
  });

  fastify.get('/facebook/callback', async (request, reply) => {
    const { code } = request.query;
    if (!code) {
      reply.status(400);
      return 'Error: código no recibido';
    }

    try {
      const orchestrator = fastify.orchestrator;
      const data = await orchestrator.facebook.exchangeCodeForToken(code);
      logger.info('Facebook autenticado');
      reply.type('text/html').send(`
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
      reply.status(500);
      return `Error: ${err.message}`;
    }
  });

  // ── Restream OAuth2 ───────────────────────────────
  fastify.get('/restream', async (request, reply) => {
    const orchestrator = fastify.orchestrator;
    const url = orchestrator.restream.getAuthUrl();
    reply.redirect(url);
  });

  fastify.get('/restream/callback', async (request, reply) => {
    const { code } = request.query;
    if (!code) {
      reply.status(400);
      return 'Error: código no recibido';
    }

    try {
      const orchestrator = fastify.orchestrator;
      const data = await orchestrator.restream.exchangeCodeForToken(code);
      logger.info('Restream autenticado');
      reply.type('text/html').send(`
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
      reply.status(500);
      return `Error: ${err.message}`;
    }
  });
}

module.exports = authRoutes;
