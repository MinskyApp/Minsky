/* =====================================================
   MultiStream Pro — Dashboard JavaScript
   Control completo vía Socket.IO + API REST
   ===================================================== */

// ── Conectar Socket.IO ───────────────────────────
const socket = io();

// ── Estado global ────────────────────────────────
const state = {
  isStreaming: false,
  obsConnected: false,
  startTime: null,
  timerInterval: null,
  currentScene: null,
  platformStatuses: {},
};

// ══════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const panelId = item.dataset.panel;
    
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(`panel-${panelId}`).classList.add('active');
    document.getElementById('pageTitle').textContent = item.textContent.trim();

    // Cargar datos del panel
    if (panelId === 'scenes' && state.obsConnected) loadScenes();
    if (panelId === 'audio' && state.obsConnected) loadAudioSources();
  });
});

// ══════════════════════════════════════════════════
// SOCKET.IO — EVENTOS
// ══════════════════════════════════════════════════
socket.on('connect', () => {
  addLog('Conectado al servidor MultiStream Pro', 'success');
});

socket.on('disconnect', () => {
  addLog('Desconectado del servidor', 'warn');
});

socket.on('status:full', (data) => {
  updateFullStatus(data);
});

socket.on('obs:connected', (data) => {
  state.obsConnected = true;
  updateOBSStatus(true);
  addLog(`OBS conectado (WebSocket v${data.version})`, 'success');
  showToast('OBS conectado correctamente', 'success');
  loadScenes();
  loadAudioSources();

  document.getElementById('btnGoLive').disabled = false;
});

socket.on('obs:disconnected', () => {
  state.obsConnected = false;
  updateOBSStatus(false);
  addLog('OBS desconectado', 'warn');
});

socket.on('obs:error', (data) => {
  addLog(`OBS Error: ${data.error}`, 'error');
  showToast(data.error, 'error');
});

socket.on('obs:sceneChanged', (data) => {
  state.currentScene = data.scene;
  updateSceneHighlight(data.scene);
  addLog(`Escena: ${data.scene}`, 'info');
});

socket.on('stream:starting', () => {
  addLog('Iniciando transmisión...', 'info');
  setStreamUI('starting');
});

socket.on('stream:started', (data) => {
  state.isStreaming = true;
  state.startTime = new Date();
  setStreamUI('live');
  startTimer();
  addLog('¡EN VIVO! Transmisión iniciada', 'success');
  showToast('¡Estás en vivo!', 'success');
  document.body.classList.add('streaming');

  // Mostrar el link si está disponible (YouTube es la prioridad)
  const linkWrapper = document.getElementById('liveLinkWrapper');
  const liveLink = document.getElementById('liveLink');
  const studioLink = document.getElementById('youtubeStudioLink');
  const btnCopyLink = document.getElementById('btnCopyLink');

  if (linkWrapper && liveLink && data.urls) {
    const url = data.urls.youtube || data.urls.facebook || Object.values(data.urls)[0];
    if (url) {
      liveLink.href = url;
      liveLink.innerText = url;
      linkWrapper.style.display = 'block';
      
      // Mostrar botón de Studio solo para YouTube
      if (studioLink) {
        studioLink.style.display = data.urls.youtube ? 'inline-block' : 'none';
      }
      
      // Listener para copiar link
      if (btnCopyLink) {
        btnCopyLink.onclick = () => {
          navigator.clipboard.writeText(url);
          showToast('Link copiado al portapapeles', 'success');
        };
      }
      
      addLog(`Enlace de transmisión: ${url}`, 'info');
    }
  }
});

socket.on('stream:stopping', () => {
  addLog('Deteniendo transmisión...', 'warn');
  const btnStop = document.getElementById('btnStop');
  if (btnStop) {
    btnStop.disabled = true;
    btnStop.innerHTML = `<span class="spinner"></span> Deteniendo...`;
  }
});

socket.on('stream:stopped', (data) => {
  state.isStreaming = false;
  stopTimer();
  setStreamUI('idle');
  addLog(`Transmisión finalizada. Duración: ${data.duration}s`, 'success');
  showToast('Transmisión finalizada', 'info');
  document.body.classList.remove('streaming');

  // Ocultar link
  const linkWrapper = document.getElementById('liveLinkWrapper');
  if (linkWrapper) linkWrapper.style.display = 'none';
});

socket.on('stream:error', (data) => {
  setStreamUI('idle');
  addLog(`Error: ${data.error}`, 'error');
  showToast(data.error, 'error');
});

socket.on('platform:status', ({ platform, status }) => {
  state.platformStatuses[platform] = status;
  updatePlatformStatus(platform, status);
});

socket.on('system:stats', (stats) => {
  updateSystemStats(stats);
});

socket.on('obs:audioLevels', (data) => {
  // Manejo de niveles de audio en tiempo real (opcional)
});

// -- Video Preview --
let previewEnabled = false;
let previewTimeout = null;

socket.on('obs:preview', (data) => {
  if (!previewEnabled) return;
  const imgData = data.imageData;
  if (imgData) {
    const imgEl = document.getElementById('streamPreviewImg');
    const placeholder = document.getElementById('previewPlaceholder');
    imgEl.src = imgData;
    imgEl.style.display = 'block';
    placeholder.style.display = 'none';

    // Clear timeout para detectar si dejamos de recibir
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
      imgEl.style.display = 'none';
      placeholder.style.display = 'flex';
      placeholder.innerHTML = '<span>Esperando video...</span>';
    }, 2000);
  }
});

// ══════════════════════════════════════════════════
// CONTROLES PRINCIPALES
// ══════════════════════════════════════════════════

// Conectar OBS
document.getElementById('btnConnectOBS').addEventListener('click', async () => {
  addLog('Conectando con OBS...', 'info');
  socket.emit('obs:connect');
});

// IR EN VIVO
document.getElementById('btnGoLive').addEventListener('click', async () => {
  if (state.isStreaming) { showToast('Ya estás en vivo', 'warn'); return; }

  const platforms = getSelectedPlatforms();
  if (platforms.length === 0) { showToast('Selecciona al menos una plataforma', 'warn'); return; }

  const useRestream = document.getElementById('streamMode').value === 'restream';

  socket.emit('stream:start', {
    title:       document.getElementById('streamTitle').value,
    description: document.getElementById('streamDescription').value,
    privacy:     document.getElementById('streamPrivacy').value,
    resolution:  document.getElementById('streamResolution').value,
    platforms,
    useRestream,
  });
});

// DETENER
document.getElementById('btnStop').addEventListener('click', () => {
  if (!state.isStreaming) return;
  if (!confirm('¿Detener la transmisión en vivo?')) return;
  socket.emit('stream:stop');
});

// Pre-check desde topbar
document.getElementById('btnPrecheck').addEventListener('click', () => runPrecheck());

// Toggle Preview
const btnTogglePreview = document.getElementById('btnTogglePreview');
if (btnTogglePreview) {
  btnTogglePreview.addEventListener('click', () => {
    previewEnabled = !previewEnabled;
    if (previewEnabled) {
      btnTogglePreview.classList.add('active');
      socket.emit('preview:start');
      addLog('Preview de video activado', 'info');
      document.getElementById('previewPlaceholder').innerHTML = '<span>Cargando preview...</span>';
    } else {
      btnTogglePreview.classList.remove('active');
      socket.emit('preview:stop');
      addLog('Preview de video desactivado', 'info');
      document.getElementById('streamPreviewImg').style.display = 'none';
      document.getElementById('previewPlaceholder').style.display = 'flex';
      document.getElementById('previewPlaceholder').innerHTML = '<span>Video Desconectado</span>';
      clearTimeout(previewTimeout);
    }
  });
}

// Auto-pausa inteligente al cambiar de pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden && previewEnabled) {
    socket.emit('preview:stop');
    addLog('Preview auto-pausado para ahorrar recursos', 'info');
  } else if (!document.hidden && previewEnabled) {
    socket.emit('preview:start');
    addLog('Preview reactivado', 'info');
  }
});

// Logs modal
document.getElementById('btnLogs').addEventListener('click', () => {
  document.getElementById('logsModal').classList.add('open');
  syncLogsToModal();
});

document.getElementById('closeLogsModal').addEventListener('click', () => {
  document.getElementById('logsModal').classList.remove('open');
});

// Limpiar logs
document.getElementById('btnClearLog').addEventListener('click', () => {
  document.getElementById('logBody').innerHTML = '';
  document.getElementById('logsModalBody').innerHTML = '';
});

// Normalize dB slider
document.getElementById('normalizeDb').addEventListener('input', function () {
  document.getElementById('normalizeDbVal').textContent = `${this.value} dB`;
});

// Pre-check panel settings
document.getElementById('btnRunPrecheck').addEventListener('click', runPrecheck);

// Test OBS connection desde settings
document.getElementById('btnTestOBS').addEventListener('click', async () => {
  addLog('Probando conexión OBS...', 'info');
  socket.emit('obs:connect');
});

// Auto-sequence button
document.getElementById('btnAutoSequence').addEventListener('click', async () => {
  if (!state.obsConnected) { showToast('Conecta OBS primero', 'warn'); return; }
  const sequence = ['Intro', 'Cámara Principal', 'Pantalla Compartida', 'Outro'];
  let i = 0;
  addLog('Iniciando secuencia automática', 'info');
  const interval = setInterval(async () => {
    if (i >= sequence.length) { clearInterval(interval); addLog('Secuencia completada', 'success'); return; }
    await fetch('/api/obs/scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: sequence[i] }),
    });
    addLog(`Escena: ${sequence[i]}`, 'info');
    i++;
  }, 5000);
});

// ══════════════════════════════════════════════════
// ESCENAS
// ══════════════════════════════════════════════════
const SCENE_ICONS = {
  'Intro': '',
  'Cámara Principal': '',
  'Pantalla Compartida': '',
  'Intermission': '',
  'Outro': '',
};

async function loadScenes() {
  try {
    const res = await fetch('/api/obs/scenes');
    const data = await res.json();
    const scenes = data.scenes || [];
    renderScenes(scenes);
  } catch {
    renderScenes([
      { sceneName: 'Intro' }, { sceneName: 'Cámara Principal' },
      { sceneName: 'Pantalla Compartida' }, { sceneName: 'Intermission' }, { sceneName: 'Outro' }
    ]);
  }
}

function renderScenes(scenes) {
  const grid = document.getElementById('scenesGrid');
  if (!scenes.length) {
    grid.innerHTML = '<div class="scene-loading">No se encontraron escenas en OBS</div>';
    return;
  }

  grid.innerHTML = scenes.map((s) => {
    const name = s.sceneName || s.name;
    const icon = SCENE_ICONS[name] || '';
    return `
      <div class="scene-card ${state.currentScene === name ? 'active' : ''}" 
           data-scene="${name}" onclick="switchScene('${name}')">
        ${icon ? `<div class="scene-preview">${icon}</div>` : ''}
        <span class="scene-name">${name}</span>
        <span class="scene-tag">${state.currentScene === name ? 'ACTIVA' : 'Click para cambiar'}</span>
      </div>
    `;
  }).join('');
}

async function switchScene(name) {
  socket.emit('scene:switch', { scene: name });
  addLog(`Cambiando a escena: ${name}`, 'info');
}

function updateSceneHighlight(sceneName) {
  document.querySelectorAll('.scene-card').forEach((card) => {
    const isActive = card.dataset.scene === sceneName;
    card.classList.toggle('active', isActive);
    const tag = card.querySelector('.scene-tag');
    if (tag) tag.textContent = isActive ? 'ACTIVA' : 'Click para cambiar';
  });
}

// ══════════════════════════════════════════════════
// AUDIO
// ══════════════════════════════════════════════════
async function loadAudioSources() {
  try {
    const res = await fetch('/api/obs/audio');
    const data = await res.json();
    renderAudioSources(data.sources || []);
  } catch {
    document.getElementById('audioSources').innerHTML =
      '<div class="audio-source-loading">No se pudo cargar fuentes de audio</div>';
  }
}

function renderAudioSources(sources) {
  const container = document.getElementById('audioSources');
  if (!sources.length) {
    container.innerHTML = '<div class="audio-source-loading">No hay fuentes de audio en OBS</div>';
    return;
  }

  container.innerHTML = sources.map((src) => `
    <div class="audio-source-card">
      <span class="audio-source-name">${src.inputName}</span>
      <input type="range" class="audio-vol-slider" 
             min="-100" max="0" value="${src.volumeDb || -6}"
             oninput="setVolume('${src.inputName}', this.value)"
             title="Volumen: ${src.volumeDb || 0} dB"/>
      <span style="font-size:12px;color:var(--text-muted);min-width:40px;font-family:monospace">
        ${src.volumeDb || 0}dB
      </span>
      <button class="btn-mute ${src.muted ? 'muted' : ''}" 
              onclick="toggleMute('${src.inputName}', this)"
              title="${src.muted ? 'Activar' : 'Silenciar'}">
        ${src.muted ? 'Muted' : 'On'}
      </button>
    </div>
  `).join('');
}

async function toggleMute(sourceName, btn) {
  const isMuted = btn.classList.contains('muted');
  socket.emit('audio:mute', { source: sourceName, muted: !isMuted });
  btn.classList.toggle('muted');
  btn.textContent = !isMuted ? 'Muted' : 'On';
}

async function setVolume(sourceName, volumeDb) {
  await fetch('/api/obs/audio/volume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: sourceName, volumeDb: parseInt(volumeDb) }),
  });
}

// ══════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════
function setStreamUI(state_) {
  const btnGoLive = document.getElementById('btnGoLive');
  const btnStop   = document.getElementById('btnStop');
  const statusText = document.getElementById('streamStatusText');
  const indicator = document.getElementById('streamIndicator');
  const liveTimer = document.getElementById('liveTimer');
  const goLiveText = document.getElementById('goLiveText');

  if (state_ === 'live') {
    btnGoLive.disabled = true;
    btnStop.disabled = false;
    statusText.textContent = 'EN VIVO AHORA';
    statusText.classList.add('live');
    liveTimer.style.display = 'flex';
    goLiveText.textContent = 'EN VIVO';
  } else if (state_ === 'starting') {
    btnGoLive.disabled = true;
    btnStop.disabled = true;
    statusText.textContent = 'Iniciando...';
    statusText.classList.remove('live');
  } else {
    btnGoLive.disabled = !state.obsConnected;
    btnStop.disabled = true;
    statusText.textContent = 'Sin transmisión';
    statusText.classList.remove('live');
    liveTimer.style.display = 'none';
    goLiveText.textContent = 'IR EN VIVO';
  }
}

function updateOBSStatus(connected) {
  const badge = document.getElementById('obsStatus');
  badge.className = `connection-badge ${connected ? 'connected' : 'error'}`;
  badge.innerHTML = `<span class="dot"></span> OBS ${connected ? 'Conectado' : 'Desconectado'}`;
  updatePlatformStatus('obs', connected ? 'connected' : 'disconnected');
}

function updatePlatformStatus(platform, status) {
  if (platform === 'obs') {
    const isConnected = ['connected', 'live', 'ready'].includes(status);
    state.obsConnected = isConnected;
    const btnGoLive = document.getElementById('btnGoLive');
    if (btnGoLive) btnGoLive.disabled = !isConnected || state.isStreaming;
  }

  // Dashboard platform toggles
  const ps = document.getElementById(`ps-${platform}`);
  if (ps) {
    const labels = { idle: 'Inactivo', live: 'En Vivo', connecting: 'Conectando', error: 'Error', connected: 'Conectado', disconnected: 'Desconectado', ready: 'Listo' };
    ps.textContent = labels[status] || status;
    ps.className = `platform-status ${['live','connected','ready'].includes(status) ? 'live' : status === 'error' ? 'error' : status === 'connecting' ? 'connecting' : ''}`;
  }

  // Platform detail cards
  const badge = document.getElementById(`${platform.slice(0,2)}-status-badge`);
  if (badge) {
    const labels2 = { idle: 'Inactivo', live: 'En Vivo', connecting: 'Conectando...', error: 'Error', connected: 'Conectado', disconnected: 'Desconectado', ready: 'Listo' };
    badge.textContent = labels2[status] || status;
    badge.className = `pd-status ${['live','connected','ready'].includes(status) ? 'live' : status === 'error' ? 'error' : status === 'connecting' ? 'connecting' : 'idle'}`;
  }
}

function updateSystemStats(stats) {
  if (stats.cpu !== undefined) {
    document.getElementById('statCPU').textContent = `${stats.cpu}%`;
    document.getElementById('barCPU').style.width = `${Math.min(stats.cpu, 100)}%`;
  }
  if (stats.memory !== undefined) {
    document.getElementById('statRAM').textContent = `${stats.memory}%`;
    document.getElementById('barRAM').style.width = `${Math.min(stats.memory, 100)}%`;
  }
  if (stats.network?.upload !== undefined) {
    const up = stats.network.upload;
    document.getElementById('statNet').textContent = up > 1024 ? `${(up/1024).toFixed(1)} MB/s` : `${up} KB/s`;
    document.getElementById('barNet').style.width = `${Math.min((up / 6000) * 100, 100)}%`;
  }
  if (stats.uptime !== undefined) {
    document.getElementById('statUptime').textContent = formatDuration(stats.uptime);
  }
}

function updateFullStatus(data) {
  if (!data) return;
  if (data.isStreaming) {
    state.isStreaming = true;
    if (data.streamStartTime) state.startTime = new Date(data.streamStartTime);
    setStreamUI('live');
    startTimer();
  }
  if (data.platforms) {
    Object.entries(data.platforms).forEach(([platform, status]) => {
      updatePlatformStatus(platform, status);
    });
  }
}

function getSelectedPlatforms() {
  const platforms = [];
  ['youtube', 'facebook', 'instagram'].forEach((p) => {
    const sw = document.getElementById(`sw-${p}`);
    if (sw?.checked) platforms.push(p);
  });
  return platforms;
}

// ── Timer ─────────────────────────────────────────
function startTimer() {
  if (state.timerInterval) return;
  state.timerInterval = setInterval(() => {
    const elapsed = state.startTime ? Math.floor((new Date() - state.startTime) / 1000) : 0;
    const formatted = formatDuration(elapsed);
    document.getElementById('timerDisplay').textContent = formatted;
    document.getElementById('statUptime').textContent = formatted;
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  document.getElementById('timerDisplay').textContent = '00:00:00';
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── Logs ──────────────────────────────────────────
function addLog(message, level = 'info') {
  const time = new Date().toLocaleTimeString('es-ES');
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;
  entry.textContent = `[${time}] ${message}`;

  const logBody = document.getElementById('logBody');
  logBody.appendChild(entry);
  logBody.scrollTop = logBody.scrollHeight;

  // Limitar a 100 entradas para mayor rendimiento
  const entries = logBody.querySelectorAll('.log-entry');
  if (entries.length > 100) entries[0].remove();
}

function syncLogsToModal() {
  const modal = document.getElementById('logsModalBody');
  modal.innerHTML = document.getElementById('logBody').innerHTML;
  modal.scrollTop = modal.scrollHeight;
}

// ── Pre-stream Check ──────────────────────────────
async function runPrecheck() {
  addLog('Ejecutando diagnóstico...', 'info');
  const resultsEl = document.getElementById('precheckResults');
  if (resultsEl) resultsEl.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Analizando...</div>';

  try {
    const res = await fetch('/api/status/precheck');
    const data = await res.json();

    if (resultsEl && data.results?.checks) {
      resultsEl.innerHTML = data.results.checks.map((check) => `
        <div class="precheck-item ${check.ok ? 'ok' : 'fail'}">
          <div class="status-indicator ${check.ok ? 'success' : 'error'}"></div>
          <div>
            <div style="font-weight:600;font-size:12px">${check.name}</div>
            <div style="color:var(--text-muted);font-size:11px">${check.message}</div>
          </div>
        </div>
      `).join('');
    }

    const allOk = data.results?.allOk;
    addLog(allOk ? 'Diagnóstico: Todo listo' : 'Diagnóstico: Revisa las advertencias', allOk ? 'success' : 'warn');
    showToast(allOk ? 'Sistema listo para transmitir' : 'Revisa la configuración', allOk ? 'success' : 'warn');
  } catch (err) {
    addLog('Error ejecutando diagnóstico', 'error');
    if (resultsEl) resultsEl.innerHTML = '<div class="precheck-item fail">Error de conexión con el servidor</div>';
  }
}

// ── Toast Notifications ───────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  const container = document.getElementById('toastContainer');
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toast-in 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Init ──────────────────────────────────────────
addLog('MultiStream Pro iniciado', 'success');
addLog('Conecta OBS para comenzar', 'info');
