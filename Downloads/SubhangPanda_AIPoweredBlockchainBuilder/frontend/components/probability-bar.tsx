type Props = {
  yesProbability: number;
};

export function ProbabilityBar({ yesProbability }: Props) {
  const boundedYes = Math.min(100, Math.max(0, yesProbability));
  const noProbability = 100 - boundedYes;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>YES {boundedYes.toFixed(1)}%</span>
        <span>NO {noProbability.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
          style={{ width: `${boundedYes}%` }}
        />
      </div>
    </div>
  );
}
