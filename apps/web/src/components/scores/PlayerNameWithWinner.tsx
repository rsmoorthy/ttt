interface PlayerNameWithWinnerProps {
  name: string;
  isWinner: boolean;
}

export function PlayerNameWithWinner({
  name,
  isWinner,
}: PlayerNameWithWinnerProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{name}</span>
      {isWinner ? (
        <span
          className="font-semibold text-green-600"
          aria-label="Match winner"
          title="Match winner"
        >
          ✓
        </span>
      ) : null}
    </span>
  );
}