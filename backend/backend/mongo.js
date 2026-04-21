/**
 * MongoDB connection for Citizen Complaints module only.
 * Independent from MySQL — does not touch existing pool or queries.
 */
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = "waste_management";

let client = null;
let dbInstance = null;

async function connectMongo() {
  if (dbInstance) return dbInstance;
  client = new MongoClient(uri);
  await client.connect();
  dbInstance = client.db(dbName);
  console.log("MongoDB Connected");
  return dbInstance;
}

async function getDb() {
  return connectMongo();
}

module.exports = { getDb, connectMongo };
