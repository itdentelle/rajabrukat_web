const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testStats() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: process.env.ADMIN_EMAIL || 'admin@dragonworm.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log("Logged in, token:", token.substring(0, 20) + "...");

    const statsRes = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats Success:", statsRes.status);
  } catch (err) {
    if (err.response) {
      console.error("API Error Response:", err.response.status, err.response.data);
    } else {
      console.error("Fetch Error:", err.message);
    }
  }
}

testStats();
