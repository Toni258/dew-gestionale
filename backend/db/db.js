// Database helper for db.
import mysql from 'mysql2/promise';
import { appConfig } from '../config/appConfig.js';

// Helper function used by pool.
export const pool = mysql.createPool({
    host: appConfig.db.host,
    user: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.database,
    port: appConfig.db.port,
    connectionLimit: appConfig.db.connectionLimit,
    namedPlaceholders: false,
});