export default function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {message}
    </div>
  );
}