"use client";

import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

interface MathLatexProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathLatex({ math, block = false, className = "" }: MathLatexProps) {
  try {
    if (block) {
      return (
        <div className={`overflow-x-auto py-1 ${className}`}>
          <BlockMath math={math} />
        </div>
      );
    }
    return (
      <span className={`inline-block ${className}`}>
        <InlineMath math={math} />
      </span>
    );
  } catch {
    return (
      <code className={`text-sm text-violet-200/80 ${className}`}>{math}</code>
    );
  }
}
