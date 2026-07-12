export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-20" aria-live="polite">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="animate-spin text-nile"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
      </svg>
      <p className="text-sm text-gray-500">Chargement…</p>
    </div>
  );
}
