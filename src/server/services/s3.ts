import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";

export const createS3Client = () => {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
    },
  });
};

const globalForS3 = globalThis as unknown as {
  s3: ReturnType<typeof createS3Client> | undefined;
};
export const s3 = globalForS3.s3 ?? createS3Client();
