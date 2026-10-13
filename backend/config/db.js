/**
 * MongoDB Atlas Connection Configuration
 * Handles DNS resolution on Windows and establishes Mongoose connection.
 */

const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where custom DNS servers cannot be modified
}

let isConnected = false;

function extractDbName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    const cleanUri = uri.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    const url = new URL(cleanUri);
    const pathname = url.pathname.replace(/^\//, '');
    if (pathname) return pathname.split('?')[0];
  } catch (e) {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    if (match) return match[1];
  }
  return null;
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_dropout_prediction';
  const role = process.env.APP_DB_ROLE || 'ai';
  const dbName = extractDbName(uri) || 'ai_dropout_prediction';

  // Startup check: log the database name in use (never log credentials or full URI)
  console.log(`[Database] Role: ${role}, Active Database: ${dbName}`);

  // Refusal check: AI service must not use the ERP database or an ERP role
  if (role !== 'ai') {
    throw new Error(`[Database Error] Refusing to start: Invalid APP_DB_ROLE '${role}' for AI backend. Must be 'ai'.`);
  }
  if (dbName === 'student_dropout_erp') {
    throw new Error(`[Database Error] Refusing to start: AI backend cannot share database 'student_dropout_erp' with ERP service. Configure MONGO_URI with database 'ai_dropout_prediction'.`);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB database '${dbName}'.`);
    console.warn(`[MongoDB Warning] Details: ${error.message}`);
    return false;
  }
};

const getDBStatus = () => isConnected || mongoose.connection.readyState === 1;

module.exports = { connectDB, getDBStatus, extractDbName };
