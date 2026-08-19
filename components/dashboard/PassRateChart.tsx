"use client";

export default function PassRateChart({
  runs,
}: {
  runs: { id: string; passRate: number | null; createdAt: string }[];
}) {
  const points = [...runs].reverse();
  const peak = 1;

  if (points.length === 0) return null;

  return (
    <div className="px-5 py-5">
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {points.map((run) => {
          const rate = run.passRate ?? 0;
          const height = Math.max((rate / peak) * 100, 3);
          const tone =
            rate >= 0.9 ? "bg-signal/80" : rate >= 0.75 ? "bg-warn/80" : "bg-crit/80";

          return (
            <div
              key={run.id}
              className="group relative flex-1"
              style={{ height: "100%" }}
              title={`${Math.round(rate * 100)}% pass`}
            >
              <div className="absolute inset-x-0 bottom-0">
                <div
                  className={`w-full rounded-[1px] ${tone}`}
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] text-mute/70">
        <span>older</span>
        <span>pass rate</span>
        <span>newest</span>
      </div>
    </div>
  );
}
