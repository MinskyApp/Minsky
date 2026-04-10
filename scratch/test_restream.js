
const axios = require('axios');
require('dotenv').config();

async function testRestream() {
  const accessToken = process.env.RESTREAM_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('No hay token de Restream');
    return;
  }

  try {
    console.log('Probando Restream API...');
    const res = await axios.get('https://api.restream.io/v2/user/channel', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Canal de Restream:', res.data.username);
  } catch (err) {
    console.error('Error detallado de Restream:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
      console.error(err.code);
    }
  }
}

testRestream();
