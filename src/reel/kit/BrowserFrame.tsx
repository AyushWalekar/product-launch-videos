import React from "react";

/** Minimal macOS-style browser window around real screenshots or recreated UI. */
export const BrowserFrame: React.FC<{
  url: string;
  width: number;
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ url, width, children, dark = false, style }) => {
  const chrome = dark ? "#1c1c22" : "#f4f4f6";
  const pill = dark ? "#2a2a33" : "#ffffff";
  const text = dark ? "#a1a1aa" : "#52525b";
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: "hidden",
        background: chrome,
        boxShadow: "0 50px 120px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", gap: 9 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            margin: "0 auto",
            background: pill,
            color: text,
            fontSize: 16,
            padding: "7px 60px",
            borderRadius: 9,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          {url}
        </div>
        <div style={{ width: 57 }} />
      </div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
