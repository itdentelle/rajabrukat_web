const axios = require('axios');
require('dotenv').config();

async function check() {
  const biteshipOrderId = "6a2fcb2276428c866983e3a7"; 
  
  try {
    const res = await axios.get(`https://api.biteship.com/v1/orders/${biteshipOrderId}`, {
      headers: { 'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}` }
    });
    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
check();
