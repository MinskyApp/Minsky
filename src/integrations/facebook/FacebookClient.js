// FacebookClient - Facebook Live API
'use strict';

const axios = require('axios');
const logger = require('../../utils/logger');

const GRAPH_URL = 'https://graph.facebook.com/v18.0';

class FacebookClient {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.pageId = process.env.FACEBOOK_PAGE_ID;

    this.http = axios.create({
      baseURL: GRAPH_URL,
      timeout: 15000,
    });
  }

  _params(extra = {}) {
    return { access_token: this.accessToken, ...extra };
  }

  // OAuth URL
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: 'http://localhost:3000/auth/facebook/callback',
      scope: 'pages_manage_posts,pages_read_engagement,publish_video,live_video',
      response_type: 'code',
    });
    return `https://www.facebook.com/dialog/oauth?${params}`;
  }

  async exchangeCodeForToken(code) {
    const res = await this.http.get('/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: 'http://localhost:3000/auth/facebook/callback',
        code,
      },
    });
    this.accessToken = res.data.access_token;
    return res.data;
  }

  // Live Video
  async createLiveVideo({ title, description, privacy = 'EVERYONE' }) {
    const endpoint = this.pageId
      ? `/${this.pageId}/live_videos`
      : '/me/live_videos';

    const privacyMap = {
      public: 'EVERYONE',
      private: 'SELF',
      friends: 'FRIENDS',
    };

    const res = await this.http.post(
      endpoint,
      {
        title,
        description,
        privacy: { value: privacyMap[privacy] || 'EVERYONE' },
        status: 'LIVE_NOW',
      },
      { params: this._params() }
    );

    logger.info(`Facebook Live creado: ${res.data.id}`);
    return res.data;
  }

  async endLiveVideo(videoId) {
    try {
      await this.http.post(
        `/${videoId}`,
        { end_live_video: true },
        { params: this._params() }
      );
      logger.info(`Facebook Live ${videoId} finalizado`);
    } catch (err) {
      logger.warn(`Error finalizando Facebook Live: ${err.message}`);
    }
  }

  async getLiveVideoStatus(videoId) {
    try {
      const res = await this.http.get(`/${videoId}`, {
        params: this._params({ fields: 'status,live_status,title,broadcast_start_time' }),
      });
      return res.data;
    } catch {
      return {};
    }
  }

  // Pages
  async getPages() {
    const res = await this.http.get('/me/accounts', {
      params: this._params({ fields: 'id,name,access_token,category' }),
    });
    return res.data.data || [];
  }

  async isConnected() {
    try {
      await this.http.get('/me', { params: this._params({ fields: 'id,name' }) });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = FacebookClient;
