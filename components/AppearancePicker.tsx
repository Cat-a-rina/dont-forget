"use client";

import type { Appearance, FontChoice, Layout, Theme } from "@/lib/appearance";
import { FONTS, LAYOUTS, THEMES } from "@/lib/appearance";

type Section = "theme" | "font" | "layout";

/** A radio group where Left/Right/Up/Down move the choice, and only the chosen option is a Tab stop. */
function Choices<T extends string>({
  label,
  value,
  options,
  onPick,
  render,
}: {
  label: string;
  value: T;
  options: { id: T }[];
  onPick: (id: T) => void;
  render: (id: T) => React.ReactNode;
}) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(i + step + options.length) % options.length].id;
    onPick(next);
    const group = e.currentTarget.parentElement;
    setTimeout(() => group?.querySelector<HTMLElement>(`[data-id="${next}"]`)?.focus(), 0);
  };

  return (
    <div className="choice-grid" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          data-id={o.id}
          aria-checked={value === o.id}
          tabIndex={value === o.id ? 0 : -1}
          className={`tile${value === o.id ? " on" : ""}`}
          onClick={() => onPick(o.id)}
          onKeyDown={(e) => move(e, i)}
        >
          {render(o.id)}
        </button>
      ))}
    </div>
  );
}

/** Pick a theme, a font pairing, and a hub layout. Changes apply right away. */
export default function AppearancePicker({
  appearance,
  onChange,
  show = ["font", "layout"],
}: {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
  show?: Section[];
}) {
  return (
    <div className="appearance">
      {show.includes("theme") && (
        <section>
          <h3 className="faint small">Theme</h3>
          <Choices<Theme>
            label="Theme"
            value={appearance.theme}
            options={THEMES}
            onPick={(theme) => onChange({ theme })}
            render={(id) => {
              const t = THEMES.find((x) => x.id === id)!;
              return (
                <>
                  <span className="swatches" aria-hidden>
                    {t.swatch.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </span>
                  <strong>{t.label}</strong>
                  <span className="faint small">{t.hint}</span>
                </>
              );
            }}
          />
        </section>
      )}
      {show.includes("font") && (
        <section>
          <h3 className="faint small">Font</h3>
          <Choices<FontChoice>
            label="Font"
            value={appearance.font}
            options={FONTS}
            onPick={(font) => onChange({ font })}
            render={(id) => {
              const f = FONTS.find((x) => x.id === id)!;
              return (
                <>
                  <span className="sample" style={{ fontFamily: f.family }} aria-hidden>
                    Aa Don&rsquo;t Forget
                  </span>
                  <strong>{f.label}</strong>
                  <span className="faint small">{f.hint}</span>
                </>
              );
            }}
          />
        </section>
      )}
      {show.includes("layout") && (
        <section>
          <h3 className="faint small">Layout</h3>
          <Choices<Layout>
            label="Layout"
            value={appearance.layout}
            options={LAYOUTS}
            onPick={(layout) => onChange({ layout })}
            render={(id) => {
              const l = LAYOUTS.find((x) => x.id === id)!;
              return (
                <>
                  <strong>{l.label}</strong>
                  <span className="faint small">{l.hint}</span>
                </>
              );
            }}
          />
        </section>
      )}
    </div>
  );
}
