"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  countryDisplayLabel,
  countryValueForStorage,
  filterCountryOptions,
  findCountryOption,
  type CountryOption,
} from "@/lib/data/country-picker";
import { getCountryCode } from "@/lib/data/countries";

export function AdminCountryPicker({
  value,
  onChange,
  placeholder = "Escribe para buscar país…",
  maxHeight = "240px",
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  maxHeight?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const resolved = useMemo(() => findCountryOption(value), [value]);
  const flagCountry = resolved?.code ?? value;
  const flagKnown = value.trim() ? getCountryCode(flagCountry) !== "un" : true;

  useEffect(() => {
    if (!open) setQuery(countryDisplayLabel(value));
  }, [value, open]);

  const options = useMemo(() => filterCountryOptions(query, 16), [query]);

  function pick(option: CountryOption) {
    onChange(option.code);
    setQuery(option.label);
    setOpen(false);
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setOpen(false);
        const normalized = countryValueForStorage(query || value);
        if (normalized && normalized !== value) onChange(normalized);
        setQuery(countryDisplayLabel(normalized || value));
      }
    }, 120);
  }

  return (
    <div ref={rootRef} className="bf-admin-country-picker">
      <div className="bf-admin-country-picker-input-wrap">
        <Search size={16} className="bf-admin-country-picker-icon" aria-hidden />
        {value.trim() ? (
          <CountryFlag country={flagCountry} size={22} className="bf-admin-country-picker-flag" />
        ) : null}
        <input
          type="text"
          className={`bf-admin-country-picker-input ${value.trim() ? "has-flag" : ""}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery(countryDisplayLabel(value));
            }
            if (e.key === "Enter" && options[0]) {
              e.preventDefault();
              pick(options[0]);
            }
          }}
        />
      </div>
      {!flagKnown && value.trim() && (
        <p className="bf-admin-country-picker-warn" role="status">
          No reconocemos la bandera de «{value}». Elige un país de la lista.
        </p>
      )}
      {open && options.length > 0 && (
        <ul id={listId} className="bf-admin-country-picker-list" style={{ maxHeight }} role="listbox">
          {options.map((opt) => (
            <li key={opt.code}>
              <button
                type="button"
                role="option"
                aria-selected={resolved?.code === opt.code}
                className={`bf-admin-country-picker-option ${resolved?.code === opt.code ? "is-on" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt)}
              >
                <CountryFlag country={opt.code} size={24} />
                <span className="bf-admin-country-picker-option-label">{opt.label}</span>
                <span className="bf-admin-country-picker-option-code">{opt.code.toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && options.length === 0 && (
        <p className="bf-admin-country-picker-empty">Sin resultados. Prueba «España», «Alemania» o «jp».</p>
      )}
    </div>
  );
}
