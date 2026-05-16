export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-eco-emerald-100)_0%,_var(--color-eco-emerald-50)_44%,_var(--color-eco-lime-50)_100%)] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-border bg-card/90 p-6 text-center shadow-sm sm:p-10">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-eco-emerald-200/70 border-t-eco-emerald-500 animate-spin" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-eco-emerald-50">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-eco-emerald-600" fill="currentColor">
              <path d="M12 3c4.4 0 7 3.6 7 7.7 0 4-3.2 7.3-7.1 7.3-3.8 0-6.9-3.1-6.9-7 0-3.6 2.7-6.3 7-8zm-1.7 4.2c-1.4 1.7-1.8 3.2-1.8 4.5 0 2.1 1.8 3.8 4 3.8 2.1 0 3.8-1.7 3.8-3.8 0-2.6-1.8-4.6-4.7-6.3-.2.8-.6 1.4-1.3 1.8z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground" role="status" aria-live="polite">
          Cargando Eco-Catch
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Preparando modulo y recursos del juego...</p>
        <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-eco-emerald-200/60">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-eco-emerald-400 via-eco-lime-400 to-eco-emerald-500" />
        </div>
      </div>
    </div>
  );
}
