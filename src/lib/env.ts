import { z } from "zod";

const DEFAULT_ADMIN_API_URL = "http://localhost:5001/api/v1";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_ADMIN_API_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_ADMIN_API_URL must be a valid URL")
    .transform((url) => url.replace(/\/+$/, "")),
});

const parsedEnv = publicEnvSchema.safeParse({
  NEXT_PUBLIC_ADMIN_API_URL:
    process.env.NEXT_PUBLIC_ADMIN_API_URL || DEFAULT_ADMIN_API_URL,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid public environment configuration: ${parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`
  );
}

export const env = {
  adminApiUrl: parsedEnv.data.NEXT_PUBLIC_ADMIN_API_URL,
} as const;
