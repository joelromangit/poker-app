'use client';

import { ChipDistribution, DistributionResult } from './types';

interface ChipBadgeProps {
  value: number;
  color: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ChipBadge({ value, color, count, size = 'md' }: ChipBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  // Determine text color based on background brightness
  const isLightColor = isColorLight(color);
  const textColor = isLightColor ? '#1F2937' : '#FFFFFF';

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold border-4 border-dashed shadow-lg transition-transform hover:scale-105`}
        style={{
          backgroundColor: color,
          color: textColor,
          borderColor: adjustColor(color, isLightColor ? -30 : 30),
        }}
      >
        {value}
      </div>
      {count !== undefined && (
        <span className="text-xs text-foreground-muted font-medium">
          ×{count}
        </span>
      )}
    </div>
  );
}

interface ChipRowProps {
  distribution: ChipDistribution;
  showTotal?: boolean;
}

export function ChipRow({ distribution, showTotal = false }: ChipRowProps) {
  const total = distribution.count * distribution.value;

  return (
    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <ChipBadge value={distribution.value} color={distribution.color} size="sm" />
        <div>
          <span className="text-foreground font-semibold">
            {distribution.count}× {distribution.name || `ficha de ${distribution.value}`}
          </span>
        </div>
      </div>
      {showTotal && (
        <span className="text-foreground-muted text-sm">
          = {total}
        </span>
      )}
    </div>
  );
}

interface DistributionDisplayProps {
  result: DistributionResult;
  playerCount: number;
}

export function DistributionDisplay({ result, playerCount }: DistributionDisplayProps) {
  if (result.perPlayer.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-muted">
        <p>No hay distribución calculada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Per Player Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">👤</span>
          Por Jugador
        </h3>
        <div className="bg-background-card rounded-xl border border-border p-4">
          {/* Visual chip stack */}
          <div className="flex flex-wrap gap-4 justify-center mb-4 pb-4 border-b border-border">
            {result.perPlayer.map((dist) => (
              <ChipBadge
                key={dist.value}
                value={dist.value}
                color={dist.color}
                count={dist.count}
                size="lg"
              />
            ))}
          </div>
          
          {/* Detailed breakdown */}
          <div className="space-y-2">
            {result.perPlayer.map((dist) => (
              <ChipRow key={dist.value} distribution={dist} showTotal />
            ))}
          </div>
          
          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-foreground-muted">Total por jugador:</span>
            <div className="text-right">
              <span className="text-xl font-bold text-accent">{result.totalValue.toLocaleString()}</span>
              <span className="text-foreground-muted ml-1">puntos</span>
              <span className="text-foreground-muted text-sm ml-2">
                ({result.totalChips} fichas)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Total */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-xl">📦</span>
          Total para la Mesa ({playerCount} jugadores)
        </h3>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {result.tableTotal.map((dist) => (
              <div
                key={dist.value}
                className="bg-background rounded-xl p-3 text-center border border-border"
              >
                <ChipBadge value={dist.value} color={dist.color} size="md" />
                <p className="mt-2 text-lg font-bold text-foreground">{dist.count}</p>
                <p className="text-xs text-foreground-muted">
                  {dist.name || `fichas de ${dist.value}`}
                </p>
              </div>
            ))}
          </div>
          
          {/* Grand totals */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-background rounded-xl p-3">
                <p className="text-2xl font-bold text-primary">
                  {(result.totalChips * playerCount).toLocaleString()}
                </p>
                <p className="text-sm text-foreground-muted">Fichas totales</p>
              </div>
              <div className="bg-background rounded-xl p-3">
                <p className="text-2xl font-bold text-accent">
                  {(result.totalValue * playerCount).toLocaleString()}
                </p>
                <p className="text-sm text-foreground-muted">Puntos totales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for color manipulation
function isColorLight(color: string): boolean {
  // Handle HSL colors
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const lightness = parseInt(match[3]);
      return lightness > 50;
    }
  }
  
  // Handle hex colors
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function adjustColor(color: string, amount: number): string {
  // Handle HSL colors
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = Math.max(0, Math.min(100, parseInt(match[3]) + amount / 2.55));
      return `hsl(${h}, ${s}%, ${Math.round(l)}%)`;
    }
  }

  // Handle hex colors
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default DistributionDisplay;
