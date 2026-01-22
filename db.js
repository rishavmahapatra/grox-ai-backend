import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db(); // uses DB name from URI
  console.log("✅ MongoDB Atlas connected");
  return db;
}
