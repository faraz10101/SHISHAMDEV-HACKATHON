import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorBox({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onRetry && <button onClick={onRetry} className="shrink-0 font-semibold underline">Retry</button>}
    </div>
  );
}

export function SuccessBox({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <div>{children}</div>
    </div>
  );
}

export function PageShell({ title, subtitle, children, narrow = false }) {
  return (
    <main className={`mx-auto w-full px-4 py-8 sm:px-6 ${narrow ? 'max-w-2xl' : 'max-w-5xl'}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>}
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </main>
  );
}

const LEVEL_STYLE = {
  none: 'bg-slate-100 text-slate-600',
  suspicious: 'bg-yellow-100 text-yellow-800',
  dangerous: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-700',
};
const LEVEL_TEXT = { none: 'No reports', suspicious: 'Suspicious', dangerous: 'Dangerous', critical: 'Critical' };

export function LevelBadge({ level }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_STYLE[level] || LEVEL_STYLE.none}`}>{LEVEL_TEXT[level] || level}</span>;
}

// One row per number / link from the community database
export function ReputationRow({ item, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="break-all font-mono text-sm font-semibold text-slate-900">{item.value}</span>
        <LevelBadge level={item.level} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {item.uniqueReporters} {item.uniqueReporters === 1 ? 'person' : 'people'} reported · {item.totalReports} total {item.totalReports === 1 ? 'report' : 'reports'}
        {item.lastReportedAt && <> · last on {new Date(item.lastReportedAt).toLocaleDateString()}</>}
      </p>
      {children}
    </div>
  );
}
