import type { Category, Completion } from "@/lib/types";
import { paletteAt } from "@/lib/style";
import { dateStr } from "@/lib/dates";

function dayLabel(at: number, now: number): string {
  const d = dateStr(new Date(at));
  if (d === dateStr(new Date(now))) return "Today";
  if (d === dateStr(new Date(now - 86400000))) return "Yesterday";
  return new Date(at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Completed items, newest first, grouped by day. One-time items can be restored to their list. */
export default function CompletedList({
  entries,
  categories,
  nowMs,
  onRestore,
}: {
  entries: Completion[];
  categories: Category[];
  nowMs: number;
  onRestore: (id: string) => void;
}) {
  if (entries.length === 0) {
    return <p className="faint">Nothing completed yet. Check an item off and it shows up here.</p>;
  }

  const days: { label: string; items: Completion[] }[] = [];
  for (const c of entries) {
    const label = dayLabel(c.at, nowMs);
    const last = days[days.length - 1];
    if (last && last.label === label) last.items.push(c);
    else days.push({ label, items: [c] });
  }

  return (
    <div className="completed">
      {days.map((d) => (
        <section key={d.label}>
          <h2 className="faint small day-label">{d.label}</h2>
          <ul className="history">
            {d.items.map((c) => {
              const cat = categories.find((x) => x.id === c.categoryId);
              const p = paletteAt(cat?.style ?? 0);
              return (
                <li key={c.id}>
                  <span className="swatch" style={{ color: p.color }} aria-hidden>
                    {p.icon}
                  </span>
                  <div>
                    <span>{c.title}</span>
                    <span className="faint small">
                      {c.categoryName}
                      {c.repeat === "daily" ? " · repeats daily" : ""}
                    </span>
                    {c.steps.length > 0 && <span className="faint small">Steps: {[...c.steps, c.title].join(" → ")}</span>}
                  </div>
                  {c.repeat === "once" && (
                    <button className="link" onClick={() => onRestore(c.id)}>
                      Restore
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
