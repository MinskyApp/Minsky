
const { google } = require('googleapis');
require('dotenv').config();

if (process.env.STRICT_SSL === '0') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function testYouTube() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'http://localhost:3000/auth/youtube/callback'
  );

  oauth2Client.setCredentials({
    access_token: process.env.YOUTUBE_ACCESS_TOKEN,
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    console.log('Probando YouTube API...');
    const res = await youtube.channels.list({ part: ['id'], mine: true });
    console.log('Canal encontrado:', JSON.stringify(res.data, null, 2));
    
    console.log('Intentando crear un broadcast de prueba (snippet)...');
    // Solo probaremos listar para no crear basura si no es necesario, o insertar con datos mínimos
    const broadcasts = await youtube.liveBroadcasts.list({
        part: ['snippet'],
        broadcastStatus: 'all',
        maxResults: 1
    });
    console.log('Broadcasts encontrados:', broadcasts.data.items.length);

  } catch (err) {
    console.error('Error detallado de YouTube:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
}

testYouTube();
