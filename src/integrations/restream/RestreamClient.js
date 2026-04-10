// RestreamClient - Integracion Restream API
'use strict';

const axios = require('axios');
const logger = require('../../utils/logger');

const BASE_URL = 'https://api.restream.io/v2';

class RestreamClient {
  constructor() {
    this.accessToken = process.env.RESTREAM_ACCESS_TOKEN;
    this.refreshToken = process.env.RESTREAM_REFRESH_TOKEN;
    this.clientId = process.env.RESTREAM_CLIENT_ID;
    this.clientSecret = process.env.RESTREAM_CLIENT_SECRET;

    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
    });

    // Interceptor para añadir token automáticamente
    this.http.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Interceptor para refresh token automático
    this.http.interceptors.response.use(
      (res) => res,
      async (err) => {
        if (err.response?.status === 401 && this.refreshToken) {
          await this.refreshAccessToken();
          err.config.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.http.request(err.config);
        }
        throw err;
      }
    );
  }

  // OAuth2
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: process.env.RESTREAM_REDIRECT_URI || 'http://localhost:3000/auth/restream/callback',
      response_type: 'code',
      scope: 'channel.read channel.write event.read event.write',
    });
    return `https://api.restream.io/login?${params}`;
  }

  async exchangeCodeForToken(code) {
    const res = await axios.post('https://api.restream.io/oauth/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: process.env.RESTREAM_REDIRECT_URI,
    });

    this.accessToken = res.data.access_token;
    this.refreshToken = res.data.refresh_token;
    return res.data;
  }

  async refreshAccessToken() {
    try {
      const res = await axios.post('https://api.restream.io/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
      });
      this.accessToken = res.data.access_token;
      if (res.data.refresh_token) {
        this.refreshToken = res.data.refresh_token;
      }
      logger.info('Restream token renovado');
    } catch (err) {
      logger.error('Error renovando token de Restream:', err.message);
      throw err;
    }
  }

  // Canal
  async getChannel() {
    const res = await this.http.get('/user/channel');
    return res.data;
  }

  async updateChannel({ title, description }) {
    const res = await this.http.patch('/user/channel', { title, description });
    return res.data;
  }

  // RTMP
  async getStreamEndpoint() {
    try {
      const res = await this.http.get('/user/streamKey');
      return {
        rtmpUrl: res.data.server || 'rtmp://live.restream.io/live',
        streamKey: res.data.streamKey,
      };
    } catch (err) {
      logger.error('Error obteniendo endpoint de Restream:', err.message);
      // Fallback con configuración manual
      return {
        rtmpUrl: 'rtmp://live.restream.io/live',
        streamKey: process.env.RESTREAM_STREAM_KEY || '',
      };
    }
  }

  // Eventos
  async createEvent({ title, description, scheduledAt } = {}) {
    try {
      if (!this.accessToken) {
        throw new Error('Falta el Token de Acceso de Restream. Por favor, autentícate en la pestaña de Plataformas.');
      }
      const payload = {
        title: title || 'Transmisión en Vivo',
        description: description || '',
        ...(scheduledAt && { plannedAt: scheduledAt }),
      };
      const res = await this.http.post('/events', payload);
      logger.info(`Evento Restream creado: ${res.data.id}`);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`Error creando evento Restream: ${msg}`);
      throw new Error(`Restream: ${msg}`);
    }
  }

  async getEvents() {
    const res = await this.http.get('/events');
    return res.data;
  }

  async endEvent(eventId) {
    try {
      await this.http.delete(`/events/${eventId}`);
      logger.info(`Evento Restream ${eventId} finalizado`);
    } catch (err) {
      logger.warn('No se pudo finalizar el evento Restream:', err.message);
    }
  }

  // Destinos
  async getChannelTargets() {
    try {
      const res = await this.http.get('/user/channel/targets');
      return res.data || [];
    } catch {
      return [];
    }
  }

  async isConnected() {
    try {
      await this.getChannel();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = RestreamClient;
