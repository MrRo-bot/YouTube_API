import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";
import { resolve } from "path";
import type { Secret } from "jsonwebtoken";
import type { StringValue } from "ms";

dotenv.config({
  path: resolve(process.cwd(), ".env"),
  quiet: true,
});

interface Config {
  port: number;
  node_env: string;
  mongodb_uri: string;
  cors_origin: string;
  access_token: Secret;
  accessExpiry: StringValue;
  refresh_token: Secret;
  refreshExpiry: StringValue;
  cloudinary_cloud_name: string;
  cloudinary_cloud_api_key: string;
  cloudinary_cloud_secret: string;
}

//checking if env vars available or not
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not defined in .env`);
  return value;
}

const isProd = process.env.NODE_ENV === "production";

const baseUri = process.env.MONGODB_URI;
if (!baseUri) throw new Error("MONGODB_URI is not defined in .env");

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  node_env: process.env.NODE_ENV || "development",
  cors_origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongodb_uri: isProd
    ? `${process.env.MONGODB_URI}/${DB_NAME}`
    : `${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0&ssl=true&replicaSet=atlas-1agi5e-shard-0&authSource=admin`,
  access_token: requireEnv("ACCESS_TOKEN_SECRET"),
  accessExpiry: (process.env.ACCESS_TOKEN_EXPIRY || "15m") as StringValue,
  refresh_token: requireEnv("REFRESH_TOKEN_SECRET"),
  refreshExpiry: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinary_cloud_api_key: process.env.CLOUDINARY_CLOUD_API_KEY || "",
  cloudinary_cloud_secret: process.env.CLOUDINARY_CLOUD_SECRET || "",
};

export default config;
