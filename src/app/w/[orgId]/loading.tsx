export default function Loading() {
  return (
    <main
      className="page-content route-skeleton"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line" />
      <div className="skeleton-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} />
        ))}
      </div>
      <div className="skeleton-panel" />
    </main>
  );
}
