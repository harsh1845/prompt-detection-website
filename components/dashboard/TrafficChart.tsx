import { formatHourLabel } from "@/lib/format";

export default function TrafficChart({
  data,
}: {
  data: { hour: string; allowed: number; blocked: number }[];
}) {
  const peak = Math.max(1, ...data.map((point) => point.allowed + point.blocked));

  return (
    <div className="px-5 py-5">
      <div className="flex items-end gap-[3px]" style={{ height: 140 }}>
        {data.map((point) => {
          const total = point.allowed + point.blocked;
          const height = (total / peak) * 100;
          const blockedShare = total === 0 ? 0 : (point.blocked / total) * 100;

          return (
            <div
              key={point.hour}
              className="group relative flex-1"
              style={{ height: "100%" }}
              title={`${formatHourLabel(point.hour)}:00 — ${point.allowed} allowed, ${point.blocked} blocked`}
            >
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end">
                {total === 0 ? (
                  <div className="h-[2px] w-full bg-hairline" />
                ) : (
                  <div
                    className="w-full overflow-hidden rounded-[1px]"
                    style={{ height: `${Math.max(height, 3)}%` }}
                  >
                    <div
                      className="w-full bg-crit/80"
                      style={{ height: `${blockedShare}%` }}
                    />
                    <div
                      className="w-full bg-signal/70"
                      style={{ height: `${100 - blockedShare}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-mute/70">
        <span>{formatHourLabel(data[0]?.hour ?? new Date().toISOString())}:00</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[1px] bg-signal/70" /> allowed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[1px] bg-crit/80" /> blocked
          </span>
        </div>
        <span>now</span>
      </div>
    </div>
  );
}
