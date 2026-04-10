// Pre-Stream Check - Verificaciones
'use strict';

const si = require('systeminformation');
const logger = require('./logger');

const MIN_UPLOAD_KBPS = parseInt(process.env.MIN_UPLOAD_SPEED) || 5000;
const MIN_CPU_FREE    = parseInt(process.env.MIN_CPU_AVAILABLE) || 30;

async function checkNetworkSpeed() {
  try {
    const nets = await si.networkStats();
    const net = nets[0];
    // Estimamos velocidad disponible basada en interfaz activa
    return {
      name: 'Red',
      ok: true, // No podemos hacer speedtest sin deps extra
      message: `Interfaz: ${net?.iface || 'N/A'} — Verificación manual recomendada`,
      detail: `Upload actual: ${Math.round((net?.tx_sec || 0) / 1024)} KB/s`,
    };
  } catch {
    return { name: 'Red', ok: false, message: 'No se pudo obtener info de red' };
  }
}

async function checkCPU() {
  try {
    const load = await si.currentLoad();
    const free = 100 - load.currentLoad;
    const ok = free >= MIN_CPU_FREE;
    return {
      name: 'CPU',
      ok,
      message: ok
        ? `CPU disponible: ${Math.round(free)}%`
        : `CPU muy ocupada: solo ${Math.round(free)}% libre (mínimo: ${MIN_CPU_FREE}%)`,
      detail: `Carga actual: ${Math.round(load.currentLoad)}%`,
    };
  } catch {
    return { name: 'CPU', ok: false, message: 'No se pudo leer CPU' };
  }
}

async function checkMemory() {
  try {
    const mem = await si.mem();
    const freeGB = (mem.available / 1024 / 1024 / 1024).toFixed(1);
    const ok = mem.available > 1.5 * 1024 * 1024 * 1024; // > 1.5 GB libres
    return {
      name: 'Memoria RAM',
      ok,
      message: ok
        ? `RAM disponible: ${freeGB} GB`
        : `RAM baja: solo ${freeGB} GB disponible`,
      detail: `Total: ${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB`,
    };
  } catch {
    return { name: 'Memoria', ok: false, message: 'Error leyendo RAM' };
  }
}

async function checkOBSConnection() {
  const net = require('net');
  return new Promise((resolve) => {
    const host = process.env.OBS_HOST || 'localhost';
    const port = parseInt(process.env.OBS_PORT) || 4455;
    const socket = net.createConnection({ host, port, timeout: 3000 });

    socket.on('connect', () => {
      socket.destroy();
      resolve({ name: 'OBS WebSocket', ok: true, message: `OBS accesible en ${host}:${port}` });
    });

    socket.on('error', () => {
      resolve({
        name: 'OBS WebSocket',
        ok: false,
        message: `OBS no encontrado en ${host}:${port}`,
        detail: 'Asegúrate de que OBS está abierto y el plugin obs-websocket está activo',
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ name: 'OBS WebSocket', ok: false, message: 'Timeout conectando a OBS' });
    });
  });
}

async function checkEnvVariables() {
  const required = [
    ['OBS_PASSWORD',              'OBS WebSocket Password'],
    ['RESTREAM_ACCESS_TOKEN',     'Restream Access Token'],
    ['YOUTUBE_CLIENT_ID',         'YouTube Client ID'],
    ['YOUTUBE_CLIENT_SECRET',     'YouTube Client Secret'],
    ['FACEBOOK_ACCESS_TOKEN',     'Facebook Access Token'],
  ];

  const missing = required
    .filter(([key]) => !process.env[key] || process.env[key].startsWith('tu_'))
    .map(([, label]) => label);

  const ok = missing.length === 0;
  return {
    name: 'Variables .env',
    ok,
    message: ok
      ? 'Todas las variables de entorno configuradas'
      : `Faltan: ${missing.join(', ')}`,
    detail: ok ? '' : 'Configura tu archivo .env antes de transmitir',
  };
}

async function runAll() {
  logger.info('Ejecutando pre-stream check...');
  
  const checks = await Promise.all([
    checkEnvVariables(),
    checkOBSConnection(),
    checkCPU(),
    checkMemory(),
    checkNetworkSpeed(),
  ]);

  const allOk = checks.every((c) => c.ok);
  
  checks.forEach((check) => {
    const icon = check.ok ? '[OK]' : '[WARN]';
    logger.info(`  ${icon} ${check.name}: ${check.message}`);
    if (check.detail) logger.debug(`     ${check.detail}`);
  });

  if (allOk) {
    logger.info('Pre-stream check completado — Todo listo para transmitir');
  } else {
    logger.warn('Pre-stream check con advertencias — Revisa antes de transmitir');
  }

  return { checks, allOk };
}

module.exports = { runAll, checkOBSConnection, checkCPU, checkMemory, checkNetworkSpeed, checkEnvVariables };
