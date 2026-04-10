// YouTubeClient - YouTube Live API
'use strict';

const { google } = require('googleapis');
const logger = require('../../utils/logger');

class YouTubeClient {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback'
    );

    if (process.env.YOUTUBE_ACCESS_TOKEN) {
      this.oauth2Client.setCredentials({
        access_token: process.env.YOUTUBE_ACCESS_TOKEN,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      });
    }

    this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
  }

  // OAuth2
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ],
      prompt: 'consent',
    });
  }

  async exchangeCodeForToken(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    logger.info('YouTube tokens obtenidos');
    return tokens;
  }

  // Broadcasts
  async createBroadcast({ title, description, privacy = 'public', scheduledStartTime }) {
    const res = await this.youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title,
          description,
          scheduledStartTime: scheduledStartTime || new Date().toISOString(),
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          latencyPreference: 'ultraLow',
          enableDvr: true,
          recordFromStart: true,
          enableEmbed: true,
          monitorStream: {
            enableMonitorStream: false,
          },
        },
      },
    });

    logger.info(`YouTube Broadcast creado: ${res.data.id}`);
    return res.data;
  }

  // Streams
  async createStream({ title, resolution = '1080p', fps = 30 }) {
    const frameRate = fps >= 60 ? '60fps' : '30fps';
    const ingestionType = 'rtmp';

    const res = await this.youtube.liveStreams.insert({
      part: ['snippet', 'cdn', 'contentDetails'],
      requestBody: {
        snippet: { title },
        cdn: {
          frameRate,
          ingestionType,
          resolution: resolution === '720p' ? '720p' : '1080p',
        },
        contentDetails: {
          isReusable: false,
        },
      },
    });

    logger.info(`YouTube Stream creado: ${res.data.id}`);
    return res.data;
  }

  // Binding
  async bindStreamToBroadcast(broadcastId, streamId) {
    const res = await this.youtube.liveBroadcasts.bind({
      part: ['id', 'snippet'],
      id: broadcastId,
      streamId,
    });
    logger.info(`YouTube: stream vinculado al broadcast`);
    return res.data;
  }

  // Transición
  // broadcastStatus: 'testing' | 'live' | 'complete'
  async transitionBroadcast(broadcastId, broadcastStatus) {
    try {
      const res = await this.youtube.liveBroadcasts.transition({
        part: ['id', 'status'],
        broadcastStatus,
        id: broadcastId,
      });
      logger.info(`YouTube Broadcast -> ${broadcastStatus}`);
      return res.data;
    } catch (err) {
      logger.warn(`YouTube transición a ${broadcastStatus}: ${err.message}`);
    }
  }

  // Broadcasts activos
  async getActiveBroadcasts() {
    const res = await this.youtube.liveBroadcasts.list({
      part: ['snippet', 'status'],
      broadcastStatus: 'active',
    });
    return res.data.items || [];
  }

  async isConnected() {
    try {
      await this.youtube.channels.list({ part: ['id'], mine: true });
      return true;
    } catch (err) {
      logger.debug('YouTube conexión fallida:', err.message);
      return false;
    }
  }
}

module.exports = YouTubeClient;
