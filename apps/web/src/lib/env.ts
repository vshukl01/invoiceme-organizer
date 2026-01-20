import { z } from "zod";

const EnvSchema = z.object({
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  WORKER_BASE_URL: z.string().min(1, "WORKER_BASE_URL is required"),
  WORKER_API_TOKEN: z.string().min(1, "WORKER_API_TOKEN is required"),
  AUTH_COOKIE_SECRET: z.string().min(1, "AUTH_COOKIE_SECRET is required"),
});

function formatZodError(e: unknown) {
  if (e instanceof z.ZodError) {
    const missing = e.issues.map((i) => i.message).join(", ");
    return `Invalid environment variables: ${missing}`;
  }
  return "Invalid environment variables.";
}

export const env = (() => {
  try {
    const parsed = EnvSchema.safeParse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      WORKER_BASE_URL: process.env.WORKER_BASE_URL,
      WORKER_API_TOKEN: process.env.WORKER_API_TOKEN,
      AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET,
    });

    if (!parsed.success) {
      // IMPORTANT: throw a plain Error string (not the ZodError object)
      throw new Error(formatZodError(parsed.error));
    }

    return parsed.data;
  } catch (e) {
    // IMPORTANT: never throw or log complex objects during Next build
    throw new Error(e instanceof Error ? e.message : "Env validation failed");
  }
})();

// import { z } from "zod";

// const EnvSchema = z.object({
//   SUPABASE_URL: z.string().min(1),
//   SUPABASE_ANON_KEY: z.string().min(1),
//   SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

//   WORKER_BASE_URL: z.string().min(1),
//   WORKER_API_TOKEN: z.string().min(1),

//   AUTH_COOKIE_SECRET: z.string().min(16)
// });

// export const env = EnvSchema.parse({
//   SUPABASE_URL: process.env.SUPABASE_URL,
//   SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
//   SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

//   WORKER_BASE_URL: process.env.WORKER_BASE_URL,
//   WORKER_API_TOKEN: process.env.WORKER_API_TOKEN,

//   AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET
// });