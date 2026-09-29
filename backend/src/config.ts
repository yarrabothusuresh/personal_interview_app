import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({path:fileURLToPath(new URL('../../../.env',import.meta.url)),quiet:true});
dotenv.config({path:'../.env',quiet:true});
dotenv.config({quiet:true});
export const config = {
  port:Number(process.env.PORT || 8080), apiKey:process.env.GEMINI_API_KEY || '',
  model:process.env.GEMINI_MODEL || 'gemini-3.8-flash', timeout:Number(process.env.AI_TIMEOUT_MS || 120000),
  frontendUrl:process.env.FRONTEND_URL || 'http://localhost:5173',
  premium:process.env.PREMIUM_MODE === 'true', paymentLink:process.env.PAYMENT_LINK || '',
  accessCode:process.env.PREMIUM_ACCESS_CODE || '', trustProxy:Number(process.env.TRUST_PROXY || 0),
};
if(config.paymentLink && !config.paymentLink.startsWith('https://')) throw new Error('PAYMENT_LINK must use HTTPS.');
