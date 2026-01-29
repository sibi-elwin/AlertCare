import 'dotenv/config'; // Explicitly load .env from the current directory
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // We use the env helper, but dotenv/config (above) ensures the vars are loaded first
    url: env("DATABASE_URL"), 
  },
});