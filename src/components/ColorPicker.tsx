"use client";

export const AVATAR_COLORS = [
  "#10B981", // Verde esmeralda
  "#3B82F6", // Azul
  "#8B5CF6", // Púrpura
  "#F59E0B", // Ámbar
  "#EF4444", // Rojo
  "#EC4899", // Rosa
  "#06B6D4", // Cyan
  "#84CC16", // Lima
];

interface ColorPickerProps {
  selected: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full transition-all ${
            selected === color
              ? "ring-2 ring-offset-2 ring-offset-background-card ring-primary scale-110"
              : "hover:scale-110"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
