import type { Metadata } from "next";
import UploadPageClient from "@/components/upload/UploadPageClient";

export const metadata: Metadata = {
  title: "Upload — AURA",
  description: "Upload a photo to generate premium captions across eight aesthetics.",
};

export default function UploadPage() {
  return <UploadPageClient />;
}
