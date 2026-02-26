import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadBase64Image } from "@/lib/cloudinary";

const uploadSchema = z.object({
  base64: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const data = uploadSchema.parse(await req.json());
    const result = await uploadBase64Image(data.base64);
    return NextResponse.json({ imageUrl: result.secure_url, imageHash: result.phash ?? null });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
