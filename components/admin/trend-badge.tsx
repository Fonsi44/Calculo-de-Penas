'use client';

type TrendBadgeProps = {
  direction?: 'up' | 'down' | 'flat';
  percentage?: number;
};

export function TrendBadge({ direction, percentage }: TrendBadgeProps) {
  if (direction === undefined || percentage === undefined || Math.abs(percentage) < 0.5) {
    return <span className="text-xxs text-text-muted">→ 0%</span>;
  }

  const arrow = direction === 'up' ? '↑' : '↓';
  const color = direction === 'up' ? 'text-success' : 'text-danger';

  return (
    <span className={`text-xxs font-bold ${color}`}>
      {arrow} {Math.abs(percentage)}%
    </span>
  );
}
