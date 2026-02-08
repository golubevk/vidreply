import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
// import * as entities from './database/entities';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'interview_platform_db',
  // entities: Object.values(entities),
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
