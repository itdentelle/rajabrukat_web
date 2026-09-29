import crypto from 'crypto';
const midtransClient = require('midtrans-client');

const serverKey = process.env.MIDTRANS_SERVER_KEY || 'your_midtrans_server_key_here';
const isConfigured = serverKey && serverKey !== 'your_midtrans_server_key_here';

export const createMidtransTransaction = async (params: {
  orderId: string;
  totalAmount: number;
  customerName: string;
  email: string;
  phone: string;
}) => {
  if (!isConfigured) {
    return null;
  }

  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey,
  });

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.totalAmount,
    },
    enabled_payments: ['gopay', 'shopeepay'],
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
      error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
      unfinish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.email,
      phone: params.phone,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction.redirect_url;
};

export const cancelMidtransTransaction = async (orderId: string) => {
  if (!isConfigured) return;

  try {
    const core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey,
    });
    await core.transaction.cancel(orderId);
    console.log(`[MIDTRANS] Successfully cancelled transaction for order ${orderId}`);
  } catch (err: any) {
    console.log(`[MIDTRANS] Could not cancel transaction ${orderId} in Midtrans: ${err.message}`);
  }
};

export const verifyMidtransSignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean => {
  const hashed = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  return hashed === signatureKey;
};
