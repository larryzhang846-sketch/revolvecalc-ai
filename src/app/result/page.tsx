import type { Metadata } from "next";
import { ResultView } from "@/components/result/ResultView";

export const metadata: Metadata = {
  title: "Results — AURA",
  description: "Your AI-generated captions across eight aesthetics.",
};

export default function ResultPage() {
  return <ResultView />;
}
