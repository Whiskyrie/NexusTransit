export interface DatabaseConfigOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  url?: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
  subscribers?: string[];
  ssl?: boolean;
  extra?: Record<string, any>;
}
