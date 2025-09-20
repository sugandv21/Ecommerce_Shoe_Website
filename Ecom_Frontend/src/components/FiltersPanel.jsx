import React, { useState } from "react";

export default function FiltersPanel({ filterSets = {}, applied = {}, onApply = () => {} }) {
  const panels = [
    { key: "style", title: "Style" },
    { key: "size", title: "Size" },
    { key: "brands", title: "Brands" },
    { key: "color", title: "Color" },
  ];

  const [activePanel, setActivePanel] = useState(null);

  const normalize = (opt, idx, key) => {
    if (opt === null || opt === undefined) return null;
    if (typeof opt === "string" || typeof opt === "number") {
      return { id: `${key}-${idx}-${String(opt)}`, label: String(opt), value: String(opt) };
    }
    return {
      id: opt.id ?? `${key}-${idx}-${opt.value ?? opt.name ?? JSON.stringify(opt)}`,
      label: opt.label ?? opt.name ?? opt.value ?? String(opt),
      value: opt.hex ?? opt.value ?? opt.slug ?? opt.id ?? opt.name ?? String(opt),
    };
  };

  const isChecked = (key, value) => {
    const arr = Array.isArray(applied[key]) ? applied[key] : [];
    return arr.includes(value);
  };

  const handleToggle = (key, value) => {
    onApply(key, value);
  };

  const renderList = (key) => {
    const raw = filterSets[key] || [];
    const list = raw.map((opt, i) => normalize(opt, i, key)).filter(Boolean);

    if (key === "color") {
      return (
        <div className="p-3">
          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {list.map((opt) => {
              const checked = isChecked(key, opt.value);
              return (
                <label
                  key={opt.id}
                  className="flex flex-col items-center gap-2 p-2 bg-white rounded cursor-pointer border hover:shadow"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleToggle(key, opt.value)}
                      aria-pressed={checked}
                      className={`w-10 h-10 rounded-full border ${checked ? "ring-2 ring-green-600" : ""}`}
                      style={{ backgroundColor: opt.value || "transparent" }}
                    />
                    {checked && (
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-semibold text-green-700 border"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-center">{opt.label}</div>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="p-3">
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {list.map((opt) => {
            const checked = isChecked(key, opt.value);
            return (
              <li key={opt.id}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(key, opt.value)}
                    className="w-4 h-4"
                  />
                  <span className={`text-sm ${checked ? "font-semibold text-green-700" : "text-gray-700"}`}>
                    {opt.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white w-full">
      <div className="flex items-center gap-6 px-6 py-2 border-b">
        <div className="flex gap-4 items-center flex-wrap">
          {panels.map((p) => {
            const isActive = activePanel === p.key;
            return (
              <div key={p.key} className="relative">
                <button
                  onClick={() => setActivePanel((prev) => (prev === p.key ? null : p.key))}
                  className="flex items-center gap-4 px-10 py-2 bg-gray-100 rounded font-medium text-gray-800 text-lg"
                  aria-expanded={isActive}
                  aria-controls={`panel-${p.key}`}
                >
                  <span>{p.title}</span>
                  <span className="text-sm">{isActive ? "▲" : "▼"}</span>
                </button>

                {isActive && (
                  <div
                    id={`panel-${p.key}`}
                    role="region"
                    aria-labelledby={`panel-${p.key}-label`}
                    className="absolute left-0 mt-2 z-30 w-72 bg-white border rounded shadow-md"
                  >
                    {renderList(p.key)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
