import { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";

/** Layout size of an element (offset sizes ignore the studio's preview scale). Holds the render until measured. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [handle] = useState(() => delayRender("measure chart area"));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let released = false;
    // The composition can mount before it is laid out, so keep measuring until the size is real.
    const measure = () => {
      if (!el.offsetWidth || !el.offsetHeight) return;
      setSize((s) => (s.width === el.offsetWidth && s.height === el.offsetHeight ? s : { width: el.offsetWidth, height: el.offsetHeight }));
      if (!released) {
        released = true;
        continueRender(handle);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [handle]);
  return [ref, size] as const;
}

/** Round axis ticks: about `count` steps of 1, 2 or 5 × 10ⁿ covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, count = 5) {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 0.5; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

/** Powers of ten (and 2×, 5× when the range is short) for log axes. */
export function logTicks(lo: number, hi: number) {
  const ticks: number[] = [];
  const decades = Math.log10(hi / lo);
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    for (const m of decades < 2.5 ? [1, 2, 5] : [1]) {
      const v = m * Math.pow(10, e);
      if (v >= lo * 0.999 && v <= hi * 1.001) ticks.push(v);
    }
  }
  return ticks;
}
