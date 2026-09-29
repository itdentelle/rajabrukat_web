const axios = require('axios');
require('dotenv').config();

async function check() {
  const payload = {
    origin_contact_name: "DragonWorm",
    origin_contact_phone: "081234567890",
    origin_address: "Jl Grogol",
    origin_postal_code: 11460,
    destination_contact_name: "Test",
    destination_contact_phone: "081234567891",
    destination_address: "Jl Test",
    destination_postal_code: 11460,
    courier_company: "sicepat",
    courier_type: "reg",
    delivery_type: "later",
    delivery_date: "2026-06-16",
    delivery_time: "12:00",
    items: [{ name: "Clothes", value: 100000, weight: 500, quantity: 1 }]
  };

  try {
    const res = await axios.post(`https://api.biteship.com/v1/orders`, payload, {
      headers: { 'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}` }
    });
    console.log("Success:", res.data.id);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
check();
