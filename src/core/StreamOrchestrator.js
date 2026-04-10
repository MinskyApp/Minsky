// StreamOrchestrator - Motor Central
// Coordina OBS, Restream, YouTube, Facebook, Instagram
'use strict';

const OBSController = require('../integrations/obs/OBSController');
const RestreamClient = require('../integrations/restream/RestreamClient');
const YouTubeClient = require('../integrations/youtube/YouTubeClient');
const FacebookClient = require('../integrations/facebook/FacebookClient');
const InstagramClient = require('../integrations/instagram/InstagramClient');
const AudioManager = require('./AudioManager');
const SceneManager = require('./SceneManager');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

class StreamOrchestrator extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.isStreaming = false;
    this.streamStartTime = null;
    this.activeSession = null;

    // Modulos
    this.obs = new OBSController(this._emitEvent.bind(this));
    this.restream = new RestreamClient();
    this.youtube = new YouTubeClient();
    this.facebook = new FacebookClient();
    this.instagram = new InstagramClient();
    this.audio = new AudioManager(this.obs);
    this.scenes = new SceneManager(this.obs);

    // Estado de plataformas
    this.platformStatus = {
      obs: 'disconnected',
      restream: 'disconnected',
      youtube: 'idle',
      facebook: 'idle',
      instagram: 'idle',
    };

    // Monitor de sistema cada 5 segundos
    this._systemMonitorInterval = null;
    
    // Temporizador para activar YouTube tras recibir ingest
    this._ytLiveTimeout = null;
  }

  // Conexion OBS
  async connectOBS() {
    try {
      this._updatePlatformStatus('obs', 'connecting');
      await this.obs.connect();
      this._updatePlatformStatus('obs', 'connected');
      
      // Escenas
      await this.scenes.initDefaultScenes();
      
      // Configurar audio
      await this.audio.applyDefaultFilters();
      
      logger.info('OBS conectado correctamente');
      return { success: true };
    } catch (err) {
      this._updatePlatformStatus('obs', 'error');
      logger.error('Error conectando OBS:', err.message);
      throw err;
    }
  }

  async disconnectOBS() {
    await this.obs.disconnect();
    this._updatePlatformStatus('obs', 'disconnected');
  }

  // Inicio de Stream
  async startStream(options = {}) {
    if (this.isStreaming) {
      throw new Error('Ya hay una transmisión activa');
    }

    const config = {
      title: options.title || process.env.STREAM_TITLE || 'Transmisión en Vivo',
      description: options.description || process.env.STREAM_DESCRIPTION || '',
      privacy: options.privacy || process.env.STREAM_PRIVACY || 'public',
      resolution: options.resolution || process.env.VIDEO_RESOLUTION || '1080p',
      platforms: options.platforms || ['youtube', 'facebook', 'instagram'],
      useRestream: options.useRestream !== false,
    };

    logger.info('Iniciando transmision...');
    this._emitEvent('stream:starting', config);

    try {
      this.activeSession = {
        id: `stream_${Date.now()}`,
        config,
        platforms: {},
        rtmpEndpoints: [],
      };

      if (config.useRestream) {
        // Modo Restream
        await this._startViaRestream(config);
      } else {
        // Modo Directo
        await this._startDirect(config);
      }

      // Iniciar OBS
      await this._configureAndStartOBS(this.activeSession.rtmpEndpoints[0]);

      // Esperar 4 segundos para YouTube
      if (config.platforms.includes('youtube') && this.activeSession.platforms.youtube) {
        this._ytLiveTimeout = setTimeout(async () => {
          try {
            const ytId = this.activeSession.platforms.youtube.broadcastId;
            await this.youtube.transitionBroadcast(ytId, 'live');
            logger.info('YouTube activado manualmente');
          } catch (e) {
            logger.warn(`Fallo transición tardía YouTube: ${e.message}`);
          }
        }, 4000);
      }

      this.isStreaming = true;
      this.streamStartTime = new Date();
      
      // Iniciar monitoreo
      this._startSystemMonitor();
      
      logger.info('Transmision en vivo iniciada');
      
      const urls = {};
      Object.keys(this.activeSession.platforms).forEach(p => {
        if (this.activeSession.platforms[p].watchUrl) {
          urls[p] = this.activeSession.platforms[p].watchUrl;
        }
      });

      this._emitEvent('stream:started', {
        session: this.activeSession,
        startTime: this.streamStartTime,
        urls
      });

      return this.activeSession;
    } catch (err) {
      logger.error('Error iniciando transmisión:', err.message);
      await this._cleanupFailedStream();
      this._emitEvent('stream:error', { error: err.message });
      throw err;
    }
  }

  // Inicio via Restream
  async _startViaRestream(config) {
    logger.info('Configurando Restream...');
    this._updatePlatformStatus('restream', 'connecting');

    try {
      // Crear evento en Restream
      const event = await this.restream.createEvent({
        title: config.title,
        description: config.description,
      });

      // Obtener RTMP endpoint de Restream
      const rtmpInfo = await this.restream.getStreamEndpoint(event.id);
      
      this.activeSession.restreamEvent = event;
      this.activeSession.rtmpEndpoints = [{
        platform: 'restream',
        url: rtmpInfo.rtmpUrl,
        key: rtmpInfo.streamKey,
        full: `${rtmpInfo.rtmpUrl}/${rtmpInfo.streamKey}`,
      }];

      this._updatePlatformStatus('restream', 'ready');
      logger.info('Restream configurado');

      // Crear streams en plataformas via Restream
      if (config.platforms.includes('youtube')) {
        await this._setupYouTubeViaRestream(config);
      }
      if (config.platforms.includes('facebook')) {
        await this._setupFacebookViaRestream(config);
      }
      if (config.platforms.includes('instagram')) {
        await this._setupInstagramViaRestream(config);
      }
    } catch (err) {
      this._updatePlatformStatus('restream', 'error');
      throw new Error(`Restream: ${err.message}`);
    }
  }

  // Inicio Directo
  async _startDirect(config) {
    const promises = [];

    if (config.platforms.includes('youtube')) {
      promises.push(this._setupYouTubeDirect(config));
    }
    if (config.platforms.includes('facebook')) {
      promises.push(this._setupFacebookDirect(config));
    }
    if (config.platforms.includes('instagram')) {
      promises.push(this._setupInstagramDirect(config));
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'rejected') {
        logger.error(`Error en plataforma: ${result.reason.message}`);
      }
    });

    if (this.activeSession.rtmpEndpoints.length === 0) {
      throw new Error('No se pudo configurar ninguna plataforma');
    }
  }

  // YouTube Direct
  async _setupYouTubeDirect(config) {
    try {
      this._updatePlatformStatus('youtube', 'connecting');
      logger.info('Configurando YouTube Live...');

      if (!process.env.YOUTUBE_ACCESS_TOKEN) {
        throw new Error('No estás autenticado en YouTube. Ve a Plataformas y haz clic en "Autenticar YouTube"');
      }

      const broadcast = await this.youtube.createBroadcast({
        title: config.title,
        description: config.description,
        privacy: config.privacy,
        scheduledStartTime: new Date().toISOString(),
      });

      const stream = await this.youtube.createStream({
        title: config.title,
        resolution: process.env.VIDEO_RESOLUTION || '1080p',
        fps: parseInt(process.env.VIDEO_FPS) || 30,
      });

      await this.youtube.bindStreamToBroadcast(broadcast.id, stream.id);
      // Esperar datos de OBS

      const endpoint = {
        platform: 'youtube',
        broadcastId: broadcast.id,
        streamId: stream.id,
        url: stream.cdn.ingestionInfo.ingestionAddress,
        key: stream.cdn.ingestionInfo.streamName,
        full: `${stream.cdn.ingestionInfo.ingestionAddress}/${stream.cdn.ingestionInfo.streamName}`,
        watchUrl: `https://youtube.com/watch?v=${broadcast.id}`,
      };

      this.activeSession.platforms.youtube = endpoint;
      this.activeSession.rtmpEndpoints.push(endpoint);
      this._updatePlatformStatus('youtube', 'live');
      logger.info(`YouTube Live configurado: ${endpoint.watchUrl}`);
    } catch (err) {
      this._updatePlatformStatus('youtube', 'error');
      logger.error(`YouTube error: ${err.message}`);
      throw err;
    }
  }

  // Facebook Direct
  async _setupFacebookDirect(config) {
    try {
      this._updatePlatformStatus('facebook', 'connecting');
      logger.info('Configurando Facebook Live...');

      if (!process.env.FACEBOOK_ACCESS_TOKEN) {
        throw new Error('No estás autenticado en Facebook. Ve a Plataformas y haz clic en "Autenticar Facebook"');
      }

      const liveVideo = await this.facebook.createLiveVideo({
        title: config.title,
        description: config.description,
        privacy: config.privacy,
      });

      const endpoint = {
        platform: 'facebook',
        videoId: liveVideo.id,
        url: liveVideo.stream_url.split('/').slice(0, -1).join('/'),
        key: liveVideo.stream_url.split('/').pop(),
        full: liveVideo.stream_url,
        watchUrl: `https://facebook.com/video/${liveVideo.id}`,
      };

      this.activeSession.platforms.facebook = endpoint;
      this.activeSession.rtmpEndpoints.push(endpoint);
      this._updatePlatformStatus('facebook', 'live');
      logger.info(`Facebook Live configurado: ${endpoint.watchUrl}`);
    } catch (err) {
      this._updatePlatformStatus('facebook', 'error');
      logger.error(`Facebook error: ${err.message}`);
      throw err;
    }
  }

  // Instagram Direct
  async _setupInstagramDirect(config) {
    try {
      this._updatePlatformStatus('instagram', 'connecting');
      logger.info('Configurando Instagram Live...');

      const liveVideo = await this.instagram.createLiveVideo({
        title: config.title,
      });

      const endpoint = {
        platform: 'instagram',
        mediaId: liveVideo.id,
        url: liveVideo.stream_url,
        key: liveVideo.stream_key,
        full: `${liveVideo.stream_url}/${liveVideo.stream_key}`,
      };

      this.activeSession.platforms.instagram = endpoint;
      this.activeSession.rtmpEndpoints.push(endpoint);
      this._updatePlatformStatus('instagram', 'live');
      logger.info('Instagram Live configurado');
    } catch (err) {
      this._updatePlatformStatus('instagram', 'error');
      logger.error(`Instagram error: ${err.message}`);
      throw err;
    }
  }

  // Configurar OBS
  async _configureAndStartOBS(primaryEndpoint) {
    if (!primaryEndpoint) {
      throw new Error('No hay endpoint RTMP disponible para OBS');
    }

    logger.info('Configurando OBS...');
    
    // Calcular bitrate óptimo según resolución
    const resolution = this.activeSession.config.resolution || '1080p';
    let bitrate = parseInt(process.env.VIDEO_BITRATE) || 4500;
    
    if (resolution === '1080p') bitrate = Math.max(bitrate, 4500);
    else if (resolution === '720p') bitrate = Math.min(bitrate, 3500);
    else if (resolution === '480p') bitrate = 2000;
    else if (resolution === '360p') bitrate = 1000;

    // Configurar encoder y resolución
    await this.obs.setVideoSettings({
      resolution,
      fps: parseInt(process.env.VIDEO_FPS) || 30,
      bitrate,
    });

    // Configurar RTMP en OBS
    await this.obs.setStreamSettings({
      server: primaryEndpoint.url,
      key: primaryEndpoint.key,
    });

    // Ir a escena de intro
    await this.scenes.switchToScene('Intro');

    // Iniciar stream en OBS
    await this.obs.startStream();
    logger.info('OBS iniciando stream...');
    
    // Esperar confirmación
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Detener Stream
  async stopStream() {
    if (!this.isStreaming) {
      throw new Error('No hay transmisión activa');
    }

    logger.info('Deteniendo transmisión...');
    this._emitEvent('stream:stopping');

    // Cancelar cualquier transición pendiente
    if (this._ytLiveTimeout) {
      clearTimeout(this._ytLiveTimeout);
      this._ytLiveTimeout = null;
    }

    try {
      this.isStreaming = false;
      
      // Detenciones paralelas
      const stopPromises = [
        this.obs.stopStream().catch(e => logger.warn('OBS Stop fail:', e.message)),
        this._stopAllPlatforms().catch(e => logger.error('Platforms Stop fail:', e.message))
      ];

      if (this.activeSession?.restreamEvent) {
        stopPromises.push(
          this.restream.endEvent(this.activeSession.restreamEvent.id).catch(() => {})
        );
      }

      await Promise.allSettled(stopPromises);
      
      this._stopSystemMonitor();
      
      const duration = this.streamStartTime 
        ? Math.floor((new Date() - this.streamStartTime) / 1000)
        : 0;

      logger.info(`Transmisión finalizada. Duración: ${this._formatDuration(duration)}`);
      this._emitEvent('stream:stopped', { duration, session: this.activeSession });
      
      this.activeSession = null;
      this.streamStartTime = null;
    } catch (err) {
      logger.error('Error deteniendo stream:', err.message);
      this.isStreaming = false; // Asegurar reset
      throw err;
    }
  }

  async _stopAllPlatforms() {
    const promises = [];

    if (this.activeSession?.platforms?.youtube) {
      const ytId = this.activeSession.platforms.youtube.broadcastId;
      promises.push(
        this.youtube.transitionBroadcast(ytId, 'complete')
          .then(() => this._updatePlatformStatus('youtube', 'idle'))
          .catch((e) => logger.error('YouTube stop error:', e.message))
      );
    }

    if (this.activeSession?.platforms?.facebook) {
      const fbId = this.activeSession.platforms.facebook.videoId;
      promises.push(
        this.facebook.endLiveVideo(fbId)
          .then(() => this._updatePlatformStatus('facebook', 'idle'))
          .catch((e) => logger.error('Facebook stop error:', e.message))
      );
    }

    if (this.activeSession?.platforms?.instagram) {
      const igId = this.activeSession.platforms.instagram.mediaId;
      promises.push(
        this.instagram.endLiveVideo(igId)
          .then(() => this._updatePlatformStatus('instagram', 'idle'))
          .catch((e) => logger.error('Instagram stop error:', e.message))
      );
    }

    await Promise.allSettled(promises);
  }

  // Escenas
  async switchScene(sceneName) {
    return this.scenes.switchToScene(sceneName);
  }

  async getSceneList() {
    return this.scenes.getSceneList();
  }

  // Audio
  async setAudioMute(sourceName, muted) {
    return this.audio.setMute(sourceName, muted);
  }

  async setAudioVolume(sourceName, volume) {
    return this.audio.setVolume(sourceName, volume);
  }

  async getAudioSources() {
    return this.audio.getInputSources();
  }

  // Reconexion
  async reconnect() {
    logger.info('Intentando reconexión...');
    try {
      await this.obs.reconnect();
      this._updatePlatformStatus('obs', 'connected');
      return { success: true };
    } catch (err) {
      logger.error('Fallo de reconexión:', err.message);
      throw err;
    }
  }

  // Monitor
  _startSystemMonitor() {
    const si = require('systeminformation');
    
    this._systemMonitorInterval = setInterval(async () => {
      try {
        const [cpu, mem] = await Promise.all([
          si.currentLoad(),
          si.mem(),
        ]);

        const stats = {
          cpu: Math.round(cpu.currentLoad),
          memory: Math.round((mem.used / mem.total) * 100),
          network: {
            upload: 0, 
            download: 0,
          },
          uptime: this.streamStartTime
            ? Math.floor((new Date() - this.streamStartTime) / 1000)
            : 0,
        };

        this._emitEvent('system:stats', stats);
      } catch (err) {
        // Silencioso
      }
    }, 2000);
  }

  _stopSystemMonitor() {
    if (this._systemMonitorInterval) {
      clearInterval(this._systemMonitorInterval);
      this._systemMonitorInterval = null;
    }
  }

  // Cleanup
  async _cleanupFailedStream() {
    this.isStreaming = false;
    this.activeSession = null;
    this._stopSystemMonitor();
    
    Object.keys(this.platformStatus).forEach((platform) => {
      if (platform !== 'obs') {
        this._updatePlatformStatus(platform, 'idle');
      }
    });
  }

  async disconnect() {
    this._stopSystemMonitor();
    await this.obs.disconnect().catch(() => {});
  }

  // Helpers
  _updatePlatformStatus(platform, status) {
    this.platformStatus[platform] = status;
    this._emitEvent('platform:status', { platform, status });
  }

  _emitEvent(event, data = {}) {
    if (this.io) {
      this.io.emit(event, data);
    }
    this.emit(event, data);
    logger.debug(`Event: ${event}`, data);
  }

  _formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  getStatus() {
    return {
      isStreaming: this.isStreaming,
      streamStartTime: this.streamStartTime,
      platforms: this.platformStatus,
      session: this.activeSession,
    };
  }

  // Restream wrappers
  async _setupYouTubeViaRestream(config) {
    // Restream maneja YouTube
    logger.info('YouTube configurado vía Restream');
    this._updatePlatformStatus('youtube', 'live');
  }

  async _setupFacebookViaRestream(config) {
    logger.info('Facebook configurado vía Restream');
    this._updatePlatformStatus('facebook', 'live');
  }

  async _setupInstagramViaRestream(config) {
    logger.info('Instagram configurado vía Restream');
    this._updatePlatformStatus('instagram', 'live');
  }
}

module.exports = StreamOrchestrator;
