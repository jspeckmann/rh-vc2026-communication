import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="panel__header">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ label, value, tone = "neutral" }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <Icon aria-hidden="true" size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

export function TextButton({
  icon: Icon,
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button className={`action-button action-button--${variant} ${className}`} {...props}>
      {Icon ? <Icon aria-hidden="true" size={17} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconToggle({ theme, onToggle }) {
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button className="icon-button" type="button" onClick={onToggle} aria-label="Theme wechseln">
      <Icon aria-hidden="true" size={18} />
    </button>
  );
}

export function LoadingState({ label = "Laedt" }) {
  return (
    <div className="state-block">
      <Loader2 aria-hidden="true" className="state-block__spinner" size={22} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-block state-block--error">
      <AlertCircle aria-hidden="true" size={22} />
      <span>{message}</span>
      {onRetry ? (
        <TextButton icon={RefreshCw} variant="secondary" onClick={onRetry}>
          Neu laden
        </TextButton>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text ? <span>{text}</span> : null}
    </div>
  );
}

export function Tag({ children, tone = "neutral" }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatKind(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
