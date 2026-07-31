const axios = require('axios');
require('dotenv').config();

async function check() {
  const payload = {
    origin_area_id: "IDNP6IDNC146IDND821IDZ11460",
    destination_area_id: "IDNP6IDNC146IDND821IDZ11460",
    couriers: "jne,sicepat,jnt",
    items: [{ name: "Clothes", value: 100000, weight: 500 }]
  };

  const response = await axios.post(`https://api.biteship.com/v1/rates/couriers`, payload, {
    headers: { 'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}` }
  });
  
  response.data.pricing.forEach(p => {
    console.log(`${p.courier_name} | ${p.courier_service_name} -> company: ${p.company}, type: ${p.type}`);
  });
}
check().catch(console.error);
