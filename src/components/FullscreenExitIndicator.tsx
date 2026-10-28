type Props = {
  count: number;
};

export function FullscreenExitIndicator({ count }: Props) {
  return (
    <div className="fullscreen-exit-indicator" aria-label={`${count} fullscreen exits`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
      </svg>
      <span className="fullscreen-exit-count">{count}</span>
      <span className="fullscreen-exit-label">Fullscreen exits</span>
    </div>
  );
}
