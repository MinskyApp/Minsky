// OBSController - Integracion OBS Studio
// Usa obs-websocket-js v5
'use strict';

const OBSWebSocket = require('obs-websocket-js').default;
const logger = require('../../utils/logger');

const RESOLUTION_MAP = {
  '360p':  { width: 640,  height: 360 },
  '480p':  { width: 854,  height: 480 },
  '720p':  { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4K':    { width: 3840, height: 2160 },
};

class OBSController {
  constructor(emitEvent) {
    this.obs = new OBSWebSocket();
    this.connected = false;
    this.emitEvent = emitEvent || (() => {});
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5;
    this._reconnectDelay = 3000;
    this.isConnecting = false;
    this._previewRunning = false;

    // Eventos OBS
    this.obs.on('ConnectionClosed', () => {
      const wasConnected = this.connected;
      this.connected = false;
      logger.warn('OBS WebSocket desconectado');
      this.emitEvent('obs:disconnected');
      
      // Solo intentar reconectar si perdimos una conexión activa
      if (wasConnected) {
        this._attemptReconnect();
      }
    });

    this.obs.on('StreamStateChanged', (data) => {
      logger.info(`OBS Stream State: ${data.outputState}`);
      this.emitEvent('obs:streamState', data);
    });

    this.obs.on('SceneTransitionStarted', (data) => {
      this.emitEvent('obs:sceneChanging', data);
    });

    this.obs.on('CurrentProgramSceneChanged', (data) => {
      logger.info(`Escena activa: ${data.sceneName}`);
      this.emitEvent('obs:sceneChanged', { scene: data.sceneName });
    });

    this.obs.on('InputVolumeMeters', (data) => {
      this.emitEvent('obs:audioLevels', data);
    });
  }

  async connect() {
    if (this.connected || this.isConnecting) {
      if (this.connected) this.emitEvent('obs:connected', { version: 'caché' });
      return { connected: true };
    }
    this.isConnecting = true;
    const host = process.env.OBS_HOST || 'localhost';
    const port = process.env.OBS_PORT || 4455;
    const password = process.env.OBS_PASSWORD || '';
    const url = `ws://${host}:${port}`;

    try {
      const { obsWebSocketVersion } = await this.obs.connect(url, password);
      this.connected = true;
      this._reconnectAttempts = 0;
      logger.info(`OBS WebSocket conectado (v${obsWebSocketVersion})`);
      this.emitEvent('obs:connected', { version: obsWebSocketVersion });
      return { connected: true, version: obsWebSocketVersion };
    } catch (err) {
      this.connected = false;
      throw new Error(`OBS WebSocket: ${err.message || err.code}`);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    try {
      this.stopPreviewInterval();
      await this.obs.disconnect();
    } catch {}
    this.connected = false;
  }

  async reconnect() {
    await this.disconnect();
    return this.connect();
  }

  async _attemptReconnect() {
    if (this._isReconnecting) return;
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      logger.error('Máximo de intentos de reconexión alcanzado');
      this.emitEvent('obs:reconnectFailed');
      return;
    }

    this._isReconnecting = true;
    this._reconnectAttempts++;
    logger.info(`Reconectando OBS (intento ${this._reconnectAttempts})...`);
    
    // Esperar 5 segundos antes de intentar para dar tiempo a OBS a recuperarse
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await this.connect();
      this._reconnectAttempts = 0;
    } catch (err) {
      this._attemptReconnect();
    } finally {
      this._isReconnecting = false;
    }
  }

  // Wrapper genérico para llamadas OBS
  async call(method, params = {}) {
    if (!this.connected) {
      throw new Error('OBS no conectado');
    }
    return this.obs.call(method, params);
  }

  async setVideoSettings({ resolution = '1080p', fps = 30, bitrate = 4500 }) {
    const res = RESOLUTION_MAP[resolution] || RESOLUTION_MAP['1080p'];
    
    try {
      // 1. Configurar resolución y FPS
      await this.obs.call('SetVideoSettings', {
        baseWidth: res.width,
        baseHeight: res.height,
        outputWidth: res.width,
        outputHeight: res.height,
        fpsNumerator: fps,
        fpsDenominator: 1,
      });
      logger.info(`Video: ${resolution} @ ${fps}fps`);

      // 2. Intentar configurar bitrate en el encoder (Simple Output)
      // Nota: Esto depende de la configuración de OBS, pero intentamos setearlo
      try {
        await this.obs.call('SetProfileParameter', {
          parameterCategory: 'SimpleOutput',
          parameterName: 'VBitrate',
          parameterValue: bitrate.toString(),
        });
        logger.info(`Bitrate configurado: ${bitrate} kbps`);
      } catch (e) {
        logger.debug('No se pudo setear bitrate mediante SetProfileParameter (posiblemente en modo avanzado)');
      }

    } catch (err) {
      logger.warn('No se pudo ajustar configuración de video:', err.message);
    }
  }

  async setStreamSettings({ server, key }) {
    // Limpiar caracteres
    const cleanServer = server.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    const cleanKey = key.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    
    try {
      logger.info(`Configurando OBS con Servidor: ${cleanServer}`);
      await this.obs.call('SetStreamServiceSettings', {
        streamServiceType: 'rtmp_custom',
        streamServiceSettings: {
          server: cleanServer,
          key: cleanKey,
          use_auth: false,
        },
      });
      logger.info('Configuracion de servidor aplicada');
    } catch (err) {
      logger.error(`Error aplicando configuracion en OBS: ${err.message}`);
      throw err;
    }
  }

  async startStream() {
    await this.obs.call('StartStream');
    logger.info('Stream iniciado en OBS');
  }

  async stopStream() {
    await this.obs.call('StopStream');
    logger.info('Stream detenido en OBS');
  }

  async startRecording() {
    await this.obs.call('StartRecord');
    logger.info('Grabación local iniciada');
  }

  async stopRecording() {
    await this.obs.call('StopRecord');
    logger.info('Grabación local detenida');
  }

  async getStats() {
    try {
      const stats = await this.obs.call('GetStats');
      return {
        fps: Math.round(stats.activeFps || 0),
        cpuUsage: Math.round(stats.cpuUsage || 0),
        memoryUsage: Math.round(stats.memoryUsage || 0),
        droppedFrames: stats.renderSkippedFrames || 0,
        networkDrop: stats.outputSkippedFrames || 0,
      };
    } catch {
      return {};
    }
  }

  async getStreamStatus() {
    try {
      const status = await this.obs.call('GetStreamStatus');
      return {
        streaming: status.outputActive,
        duration: status.outputDuration,
        timecode: status.outputTimecode,
        bytes: status.outputBytes,
      };
    } catch {
      return { streaming: false };
    }
  }

  startPreviewInterval(fps = 2) {
    if (this._previewInterval) return;
    this._previewInterval = setInterval(async () => {
      if (!this.connected || this._previewRunning) return;
      this._previewRunning = true;
      try {
        const { currentProgramSceneName } = await this.call('GetCurrentProgramScene');
        const { imageData } = await this.call('GetSourceScreenshot', {
          sourceName: currentProgramSceneName,
          imageFormat: 'jpeg',
          imageWidth: 320,
          imageHeight: 180,
          imageCompressionQuality: 30 // Alta compresión para ahorrar ancho de banda
        });
        this.emitEvent('obs:preview', { imageData });
      } catch (err) {
        // Ignorar errores esporádicos al intentar capturar el preview
      } finally {
        this._previewRunning = false;
      }
    }, 1000 / fps);
  }

  stopPreviewInterval() {
    if (this._previewInterval) {
      clearInterval(this._previewInterval);
      this._previewInterval = null;
    }
    this._previewRunning = false;
  }
}


module.exports = OBSController;
