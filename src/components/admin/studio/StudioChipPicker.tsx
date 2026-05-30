"use client";

type StudioChipPickerProps = {
  label: string;
  pool: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  variant?: "default" | "ban";
};

export function StudioChipPicker({
  label,
  pool,
  selected,
  onChange,
  hint,
  variant = "default",
}: StudioChipPickerProps) {
  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((s) => s !== name));
    else onChange([...selected, name]);
  }

  return (
    <div className={`bf-studio-chip-picker ${variant === "ban" ? "is-ban" : ""}`}>
      <span className="bf-studio-chip-picker-label">{label}</span>
      {hint && <span className="bf-studio-chip-picker-hint">{hint}</span>}
      <div className="bf-studio-chip-picker-grid">
        {pool.map((name) => (
          <button
            key={name}
            type="button"
            className={`bf-studio-chip ${selected.includes(name) ? "is-on" : ""}`}
            onClick={() => toggle(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="bf-studio-chip-picker-order">
          Orden: {selected.join(" → ")}
        </p>
      )}
    </div>
  );
}
