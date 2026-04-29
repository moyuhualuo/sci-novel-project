type ToastProps = {
  message: string;
};

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast-shell" role="status" aria-live="polite">
      <div className="toast-card">{message}</div>
    </div>
  );
}

