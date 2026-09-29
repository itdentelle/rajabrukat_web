import axios from 'axios';

export const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || 'dummy_key';
export const BITESHIP_BASE_URL = 'https://api.biteship.com/v1';

export const searchBiteshipAreas = async (query: string) => {
  if (!query) return [];
  const response = await axios.get(
    `${BITESHIP_BASE_URL}/maps/areas?countries=ID&input=${encodeURIComponent(query)}&type=single`,
    {
      headers: { Authorization: `Bearer ${BITESHIP_API_KEY}` },
    }
  );
  return response.data.areas.map((area: any) => ({
    id: area.id,
    label: area.name,
  }));
};

export const calculateBiteshipCost = async (
  destination: string,
  weight: number,
  couriers: string
) => {
  const payload = {
    origin_area_id: 'IDNP6IDNC146IDND821IDZ11460', // ID Grogol Petamburan Biteship
    destination_area_id: destination,
    couriers: couriers,
    items: [
      {
        name: 'Clothes',
        value: 100000,
        weight: weight || 500,
      },
    ],
  };

  const response = await axios.post(`${BITESHIP_BASE_URL}/rates/couriers`, payload, {
    headers: {
      Authorization: `Bearer ${BITESHIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data.pricing.map((p: any) => ({
    service: p.courier_service_name,
    cost: p.price,
  }));
};

export const requestBiteshipPickup = async (params: {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  shippingMethod?: string | null;
}) => {
  if (BITESHIP_API_KEY === 'dummy_key') {
    return {
      biteshipOrderId: `DUMMY-${Date.now()}`,
      trackingNumber: `TRACK-${Date.now()}`,
    };
  }

  const postalCodeMatch = params.address.match(/\b\d{5}\b/);
  const destPostalCode = postalCodeMatch ? parseInt(postalCodeMatch[0]) : 11460;

  let courier_company = 'jne';
  let courier_type = 'reg';

  if (params.shippingMethod) {
    const parts = params.shippingMethod.split(' ');
    if (parts.length >= 2) {
      courier_company = parts[0].toLowerCase();
      if (courier_company === 'j&t') courier_company = 'jnt';

      let rawType = parts.slice(1).join(' ').toLowerCase();
      if (rawType.includes('reguler') || rawType === 'reg') {
        courier_type = 'reg';
      } else if (rawType.includes('trucking')) {
        courier_type = 'jtr';
      } else if (rawType.includes('yes') || rawType.includes('yakin')) {
        courier_type = 'yes';
      } else if (rawType.includes('besok') || rawType.includes('best')) {
        courier_type = 'best';
      } else if (rawType.includes('ez')) {
        courier_type = 'ez';
      } else {
        courier_type = parts.slice(1).join('_').toLowerCase();
      }
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const delivery_date = `${yyyy}-${mm}-${dd}`;

  const payload = {
    origin_contact_name: 'Raja Brukat Official',
    origin_contact_phone: '081234567890',
    origin_address: 'Jl. Grogol Raya No. 1, Jakarta Barat',
    origin_postal_code: 11460,
    destination_contact_name: params.customerName,
    destination_contact_phone: params.phone,
    destination_address: params.address,
    destination_postal_code: destPostalCode,
    courier_company,
    courier_type,
    delivery_type: 'later',
    delivery_date,
    delivery_time: '12:00',
    items: [{ name: 'Clothes', value: params.totalAmount, weight: 500, quantity: 1 }],
  };

  const response = await axios.post(`${BITESHIP_BASE_URL}/orders`, payload, {
    headers: {
      Authorization: `Bearer ${BITESHIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    biteshipOrderId: response.data.id,
    trackingNumber: response.data.courier.tracking_id || response.data.courier.waybill_id,
  };
};

export const trackBiteshipOrder = async (biteshipOrderId: string) => {
  const response = await axios.get(`${BITESHIP_BASE_URL}/orders/${biteshipOrderId}`, {
    headers: { Authorization: `Bearer ${BITESHIP_API_KEY}` },
  });
  return {
    status: response.data.status,
    history: response.data.courier.history || [],
  };
};
