/*
404: Invalid token
406: Token vs action mismatch
500: validation error
 */

import axios from 'axios';
import Env from '@ioc:Adonis/Core/Env';

export default async function (token: string) {
  const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
  const response = await axios.post(verificationUrl, {secret: Env.get('RECAPTCHA_SECRET_KEY'), response: token},{
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
  });
  return !!(response.data && response.data.success && response.data.score >= 0.5);
}
