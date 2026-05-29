/**
 * Database Connection Module - Backward Compatibility Wrapper
 * 
 * This module maintains backward compatibility by wrapping the new
 * enhanced MongoDB connection handler from mongoConnection.js
 * 
 * Usage:
 * const connectDB = require('./config/db');
 * await connectDB();
 */

const { connectDB: mongoConnect } = require("./mongoConnection");

module.exports = mongoConnect;