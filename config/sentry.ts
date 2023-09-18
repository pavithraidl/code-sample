import { SentryConfig } from '@ioc:Adonis/Addons/Sentry';
import Env from '@ioc:Adonis/Core/Env';
import { version } from '../package.json';

export default {
  environment: Env.get('APP_ENV', 'production'),
  release: version,
  enabled: false,
  dsn: Env.get('SENTRY_DSN', ''),
  tracesSampleRate: 0.2,
} as SentryConfig;
