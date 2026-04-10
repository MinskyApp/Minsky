// InstagramClient - Instagram Live API
'use strict';

const axios = require('axios');
const logger = require('../../utils/logger');

const GRAPH_URL = 'https://graph.facebook.com/v18.0';

class InstagramClient {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.userId = process.env.INSTAGRAM_USER_ID;

    this.http = axios.create({
      baseURL: GRAPH_URL,
      timeout: 15000,
    });
  }

  _params(extra = {}) {
    return { access_token: this.accessToken, ...extra };
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: 'http://localhost:3000/auth/instagram/callback',
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights',
      response_type: 'code',
    });
    return `https://api.instagram.com/oauth/authorize?${params}`;
  }

  // Instagram Live API
  async createLiveVideo({ title }) {
    if (!this.userId || !this.accessToken) {
      throw new Error(
        'Instagram: INSTAGRAM_USER_ID y INSTAGRAM_ACCESS_TOKEN son requeridos. ' +
        'Asegúrate de tener aprobación de Meta Business para Live.'
      );
    }

    try {
      // Crear sesión de transmisión en vivo via Instagram Broadcasting API
      const res = await this.http.post(
        `/${this.userId}/live_videos`,
        { status: 'LIVE_NOW' },
        { params: this._params() }
      );

      logger.info(`Instagram Live creado: ${res.data.id}`);
      return {
        id: res.data.id,
        stream_url: res.data.stream_url,
        stream_key: res.data.secure_stream_url?.split('/').pop() || res.data.stream_key || '',
      };
    } catch (err) {
      // Instagram Live API está muy limitada
      // Fallback: documentar configuración vía Restream
      logger.warn('Instagram Live API limitada:', err.message);
      logger.info('Instagram: usa Restream para retransmitir a Instagram');
      
      return this._getRestreamWorkaround(title);
    }
  }

  _getRestreamWorkaround(title) {
    // Instagram no tiene API pública completa para Live.
    // La solución recomendada es usar Restream como intermediario.
    return {
      id: 'restream_instagram',
      stream_url: 'rtmp://live.restream.io/live',
      stream_key: process.env.RESTREAM_STREAM_KEY || 'configurar_en_restream',
      note: 'Instagram Live se transmite a través de Restream. Conecta tu cuenta de Instagram en app.restream.io',
      manualSetup: [
        '1. Ve a app.restream.io/channels',
        '2. Añade Instagram como destino',
        '3. Autoriza tu cuenta de Instagram Business',
        '4. Restream distribuirá automáticamente a Instagram',
      ],
    };
  }

  async endLiveVideo(mediaId) {
    if (mediaId === 'restream_instagram') return;

    try {
      await this.http.post(
        `/${mediaId}`,
        { end_live_video: true },
        { params: this._params() }
      );
      logger.info(`Instagram Live ${mediaId} finalizado`);
    } catch (err) {
      logger.warn(`Error finalizando Instagram Live: ${err.message}`);
    }
  }

  async getLiveStatus(mediaId) {
    try {
      const res = await this.http.get(`/${mediaId}`, {
        params: this._params({ fields: 'status,title,broadcast_start_time' }),
      });
      return res.data;
    } catch {
      return {};
    }
  }

  async isConnected() {
    if (!this.accessToken || !this.userId) return false;
    try {
      await this.http.get(`/${this.userId}`, {
        params: this._params({ fields: 'id,username' }),
      });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = InstagramClient;
