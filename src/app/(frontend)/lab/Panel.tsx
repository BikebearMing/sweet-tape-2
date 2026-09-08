"use client";

import { useEffect, useState, type CSSProperties } from "react";

/* The lab's tuning panel — groups of numbers, a slider and a box for each, and
   the JSON to send back. Shared by every lab that places things: the page
   renders the real section, hands this its numbers and a function that writes
   them onto the live nodes, and the stylesheet is never touched until the JSON
   comes back. */
export type Params = Record<string, Record<string, number>>;

type Props<P extends Params> = {
  title: string;
  defaults: P;
  apply: (p: P) => void;
  /** Slider bounds for a field; default is what the value looks like it is. */
  range?: (group: string, field: string) => [number, number];
};

function guess(field: string, v: number): [number, number] {
  if (field.startsWith("r") || field === "rotate") return [-180, 180];
  return [Math.min(0, v - 30), Math.max(100, v + 30)];
}

export default function Panel<P extends Params>({
  title,
  defaults,
  apply,
  range,
}: Props<P>) {
  const [p, setP] = useState<P>(defaults);
  const [open, setOpen] = useState(true);

  useEffect(() => apply(p), [p, apply]);

  const set = (g: string, f: string, v: number) =>
    setP((o) => ({ ...o, [g]: { ...o[g], [f]: v } }));

  const json = JSON.stringify(p, null, 2);

  return (
    <aside style={{ ...panel, ...(open ? null : { width: "auto" }) }}>
      <div style={row}>
        <strong>{title}</strong>
        <button style={btn} onClick={() => setOpen(!open)}>
          {open ? "hide" : "show"}
        </button>
        <button style={btn} onClick={() => setP(defaults)}>
          reset
        </button>
        <button style={btn} onClick={() => navigator.clipboard.writeText(json)}>
          copy json
        </button>
      </div>
      {open && (
        <>
          {Object.keys(p).map((g) => (
            <fieldset key={g} style={group}>
              <legend style={legend}>{g}</legend>
              {Object.entries(p[g]).map(([f, v]) => {
                const [min, max] = range?.(g, f) ?? guess(f, defaults[g][f]);
                return (
                  <label key={f} style={row}>
                    <span style={{ width: 50 }}>{f}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={0.1}
                      value={v}
                      onChange={(e) => set(g, f, parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      step={0.1}
                      value={v}
                      onChange={(e) =>
                        set(g, f, parseFloat(e.target.value) || 0)
                      }
                      style={num}
                    />
                  </label>
                );
              })}
            </fieldset>
          ))}
          <pre style={dump}>{json}</pre>
        </>
      )}
    </aside>
  );
}

const panel: CSSProperties = {
  position: "fixed",
  top: 8,
  right: 8,
  zIndex: 1000,
  width: 340,
  maxHeight: "calc(100vh - 16px)",
  overflow: "auto",
  padding: 10,
  background: "rgba(255,255,255,.94)",
  color: "#111",
  font: "12px/1.4 ui-monospace, monospace",
  borderRadius: 8,
  boxShadow: "0 4px 24px rgba(0,0,0,.25)",
};
const row: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  marginBottom: 4,
};
const group: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "4px 8px",
  margin: "6px 0",
};
const legend: CSSProperties = { fontWeight: 700, padding: "0 4px" };
const btn: CSSProperties = {
  font: "inherit",
  padding: "2px 8px",
  cursor: "pointer",
};
const num: CSSProperties = { width: 62, font: "inherit" };
const dump: CSSProperties = {
  fontSize: 10,
  background: "#f3f3f3",
  padding: 8,
  borderRadius: 6,
  userSelect: "all",
};
