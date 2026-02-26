import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function uploadBase64Image(base64: string) {
  if (!cloudName || !apiKey || !apiSecret) {
    const fallbackHash = Buffer.from(base64.slice(0, 256)).toString("base64").slice(0, 64);
    return { secure_url: base64, phash: fallbackHash };
  }

  return cloudinary.uploader.upload(base64, {
    folder: "campustrace/items",
    phash: true,
  });
}
