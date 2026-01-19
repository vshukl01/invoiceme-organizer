import { z } from "zod";

const EnvSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  WORKER_BASE_URL: z.string().min(1),
  WORKER_API_TOKEN: z.string().min(1),

  AUTH_COOKIE_SECRET: z.string().min(16)
});

export const env = EnvSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  WORKER_BASE_URL: process.env.WORKER_BASE_URL,
  WORKER_API_TOKEN: process.env.WORKER_API_TOKEN,

  AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET
});
