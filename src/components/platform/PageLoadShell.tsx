export function PageLoadShell({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="bf-page-ultra" style={{ padding: "48px 20px", textAlign: "center" }} aria-busy="true">
      <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.55)" }}>{label}</p>
      <div
        style={{
          margin: "16px auto 0",
          width: 120,
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: "45%",
            borderRadius: "inherit",
            background: "linear-gradient(90deg,#c99712,#f3bc18)",
            animation: "bf-boot-pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
