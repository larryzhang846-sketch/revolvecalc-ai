"use client";

import { motion } from "framer-motion";
import type { CalculationHistoryEntry } from "@/types/history";
import {
  CALCULATION_MODE_ZH,
  formatHistoryTime,
} from "@/lib/history/calculationHistory";
import { formatNumber } from "@/lib/revolve/integration";

interface HistoryPanelProps {
  entries: CalculationHistoryEntry[];
  ready: boolean;
  onReload: (entry: CalculationHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({
  entries,
  ready,
  onReload,
  onDelete,
  onClearAll,
}: HistoryPanelProps) {
  if (!ready) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-card/40 p-6 text-center text-sm text-slate-500">
        正在加载历史记录…
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-card/80 p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">历史记录</h2>
          <p className="mt-1 text-xs text-slate-500">
            每次成功计算后自动保存，刷新页面后仍可查看
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
          >
            清空历史记录
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center text-sm text-slate-500">
          暂无记录。点击「计算体积」后，结果会显示在这里。
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, i) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-200">
                      {CALCULATION_MODE_ZH[entry.calculationMode]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatHistoryTime(entry.createdAt)}
                    </span>
                  </div>
                  <p className="font-mono text-slate-300">
                    f(x) = <span className="text-cyan-300/90">{entry.fExpr}</span>
                    ，g(x) ={" "}
                    <span className="text-violet-300/90">{entry.gExpr}</span>
                  </p>
                  <p className="text-slate-400">
                    区间：[{entry.a}, {entry.b}] ·{" "}
                    {entry.calculationMode === "revolution"
                      ? `旋转轴：${entry.modeDetailLabel}`
                      : `截面：${entry.modeDetailLabel}`}
                  </p>
                  <p className="text-base font-semibold text-white">
                    体积 ≈ {formatNumber(entry.volume)}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      单位³
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onReload(entry)}
                    className="rounded-lg border border-violet-500/35 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-violet-500/25"
                  >
                    重新载入
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
