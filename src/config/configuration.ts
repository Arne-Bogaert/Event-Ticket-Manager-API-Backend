export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000'),
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    maxAge: parseInt(process.env.CORS_MAX_AGE || '10800'),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  log: {
    levels: process.env.LOG_LEVELS
      ? (JSON.parse(process.env.LOG_LEVELS) as LogLevel[])
      : ['warn', 'error', 'log'],
    disabled: process.env.LOG_DISABLED === 'true',
  },
  auth: {
    maxDelay: parseInt(process.env.AUTH_MAX_DELAY || '5000'),
    hashLength: parseInt(process.env.AUTH_HASH_LENGTH || '32'),
    timeCost: parseInt(process.env.AUTH_HASH_TIME_COST || '6'),
    memoryCost: parseInt(process.env.AUTH_HASH_MEMORY_COST || '65536'),
    jwt: {
      expirationInterval:
        Number(process.env.AUTH_JWT_EXPIRATION_INTERVAL) || 3600,
      secret: process.env.AUTH_JWT_SECRET || '',
      audience:
        process.env.AUTH_JWT_AUDIENCE || 'event-ticker-manager.hogent.be',
      issuer: process.env.AUTH_JWT_ISSUER || 'event-ticket-manager.hogent.be',
    },
  },
});

export interface ServerConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
  cors: CorsConfig;
  log: LogConfig;
  auth: AuthConfig;
}

export interface DatabaseConfig {
  url: string;
}

export interface CorsConfig {
  origins: string[];
  maxAge: number;
}

export interface LogConfig {
  levels: LogLevel[];
  disabled: boolean;
}

export interface JwtConfig {
  expirationInterval: number;
  secret: string;
  audience: string;
  issuer: string;
}

export interface AuthConfig {
  maxDelay: number;
  hashLength: number;
  timeCost: number;
  memoryCost: number;
  jwt: JwtConfig;
}

type LogLevel = 'warn' | 'error' | 'log' | 'debug' | 'verbose';
