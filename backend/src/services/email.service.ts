import { Worker } from 'bullmq';
import { transporter, getEmailTemplate } from '../config/email';
import { emailQueue, isRedisConnected, redisClient, REDIS_URL } from '../config/redis';

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  title: string,
  bodyHTML: string,
  buttonText?: string,
  buttonUrl?: string
) => {
  if (emailQueue && isRedisConnected) {
    await emailQueue.add('send-notification', { email, subject, title, bodyHTML, buttonText, buttonUrl });
    console.log(`[EMAIL QUEUE] Queued notification email for ${email} - Subject: ${subject}`);
  } else {
    const html = getEmailTemplate(title, bodyHTML, buttonText, buttonUrl);
    transporter
      .sendMail({
        from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html,
      })
      .catch((err: any) => console.error('Direct Email Error:', err?.message || err));
  }
};

export const sendOTPEmail = async (email: string, otp: string) => {
  if (emailQueue && isRedisConnected) {
    await emailQueue.add('send-otp', { email, otp });
    console.log(`[EMAIL QUEUE] Queued OTP email for ${email}`);
  } else {
    console.log(
      `\n=========================================\n[DIRECT OTP EMAIL] OTP for ${email} is: ${otp}\n=========================================\n`
    );
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter
        .sendMail({
          from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Login/Register OTP Code',
          text: `Your RajaBrukat OTP code is: ${otp}. It will expire in 5 minutes.`,
        })
        .catch((err: any) => console.error('Direct OTP Email Error:', err?.message || err));
    }
  }
};

export let emailWorker: Worker | null = null;

export const initEmailWorker = () => {
  if (REDIS_URL && redisClient) {
    try {
      emailWorker = new Worker(
        'emailQueue',
        async (job) => {
          if (job.name === 'send-notification') {
            const { email, subject, title, bodyHTML, buttonText, buttonUrl } = job.data;
            const html = getEmailTemplate(title, bodyHTML, buttonText, buttonUrl);
            const mailOptions = {
              from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: subject,
              html: html,
            };
            await new Promise((resolve) => setTimeout(resolve, 500));
            await transporter.sendMail(mailOptions);
          } else if (job.name === 'send-otp') {
            const { email, otp } = job.data;
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
              console.log(
                `\n=========================================\n[DUMMY EMAIL WORKER] OTP for ${email} is: ${otp}\n=========================================\n`
              );
              return;
            }
            await transporter.sendMail({
              from: `"RajaBrukat" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: 'Your Login/Register OTP Code',
              text: `Your RajaBrukat OTP code is: ${otp}.`,
            });
          }
        },
        { connection: redisClient as any }
      );
      console.log('BullMQ Email Worker initialized 🚀');
    } catch (err) {
      console.error('Failed to initialize BullMQ Email Worker:', err);
    }
  }
};
