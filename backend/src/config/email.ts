import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

export const getEmailTemplate = (
  title: string,
  bodyHTML: string,
  buttonText?: string,
  buttonUrl?: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { background-color: #000000; color: #ffffff; text-align: center; padding: 30px 20px; text-transform: uppercase; letter-spacing: 2px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .content h2 { margin-top: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .button-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
        .footer { background-color: #f3f4f6; text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Raja Brukat</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${bodyHTML}
          ${
            buttonText && buttonUrl
              ? `
            <div class="button-container">
              <a href="${buttonUrl}" class="btn">${buttonText}</a>
            </div>
          `
              : ''
          }
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Raja Brukat. All rights reserved.<br>
          Spesialis Kain Brukat & Renda Impor Premium.
        </div>
      </div>
    </body>
    </html>
  `;
};
