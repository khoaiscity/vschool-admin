import { config as dotenv } from "dotenv";
dotenv();

export let config = {
  apiAdminUrl: process.env.API_ADMIN_URL || 'http://localhost:8000',
  apiResourceUrl: process.env.API_RESOURCE_URL || 'http://localhost:3000',
  port: process.env.PORT || 3200,
  host: process.env.HOST || 'localhost',
};
