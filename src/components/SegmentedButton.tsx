"use client";

// Botón de grupo segmentado reutilizable (filtros de periodo, vistas, etc.)
export default function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-primary text-white"
          : "text-foreground-muted hover:text-foreground hover:bg-background-secondary"
      }`}
    >
      {children}
    </button>
  );
}
