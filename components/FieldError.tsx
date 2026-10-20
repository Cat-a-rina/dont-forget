/**
 * An error that sits right under its field. Say what is wrong and what to do next.
 * Connect it to the field with aria-describedby={id} and aria-invalid on the field.
 */
export default function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      <span aria-hidden>! </span>
      {message}
    </p>
  );
}

/** Notice shown when a draft was restored, with a way to throw it away. */
export function DraftNote({ onDiscard }: { onDiscard: () => void }) {
  return (
    <p className="draft-note small" role="status">
      We kept what you typed last time.{" "}
      <button type="button" className="link" onClick={onDiscard}>
        Discard it
      </button>
    </p>
  );
}
