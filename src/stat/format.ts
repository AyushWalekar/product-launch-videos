export type ValueFormat = "number" | "int" | "pct" | "pct100" | "usd" | "cents" | "x" | "tokens" | "seconds" | "elo";

/**
 * Format a value for a label. `pct` takes a 0–1 fraction, `pct100` a 0–100 number,
 * `usd` switches to cents under $1 the way the article figures do.
 */
export function formatValue(v: number, format: ValueFormat = "number", decimals?: number): string {
  const d = (n: number) => (decimals ?? n);
  switch (format) {
    case "int":
    case "elo":
      return Math.round(v).toLocaleString("en-US");
    case "pct":
      return `${(v * 100).toFixed(d(v >= 0.1 ? 0 : 1))}%`;
    case "pct100":
      return `${v.toFixed(d(v >= 10 ? 0 : 1))}%`;
    case "usd":
      if (v >= 1000) return `$${(v / 1000).toFixed(d(1))}k`;
      if (v >= 1) return `$${v.toFixed(d(2))}`;
      return `${(v * 100).toFixed(d(1))}¢`;
    case "cents":
      return `${(v * 100).toFixed(d(1))}¢`;
    case "x":
      return `${v.toFixed(d(v >= 10 ? 0 : 1))}×`;
    case "tokens": {
      const units: [string, number][] = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
      for (const [u, n] of units) if (v >= n) return `${(v / n).toFixed(d(v / n >= 100 ? 0 : 1))}${u}`;
      return `${Math.round(v)}`;
    }
    case "seconds":
      return v >= 120 ? `${(v / 60).toFixed(d(1))} min` : `${v.toFixed(d(v >= 10 ? 0 : 1))}s`;
    default:
      return v.toLocaleString("en-US", { maximumFractionDigits: d(v >= 100 ? 0 : 1) });
  }
}

/** Axis tick label: same units, no trailing zeros ("$2", "20¢", "0%"). */
export const formatTick = (v: number, format: ValueFormat = "number") =>
  formatValue(v, format).replace(/\.0+(?=\D|$)/, "");
