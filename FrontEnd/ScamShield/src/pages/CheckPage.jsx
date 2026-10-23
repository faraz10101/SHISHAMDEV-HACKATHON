import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2, Search, Info } from 'lucide-react';
import { checkContent } from '../api/scamshield';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PageShell, ErrorBox, ReputationRow } from '../components/common/Bits';

const THEME = {
  red: { box: 'border-red-200 bg-red-50', text: 'text-red-700', bar: 'bg-red-500', Icon: ShieldAlert, label: 'Scam' },
  yellow: { box: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-800', bar: 'bg-yellow-500', Icon: ShieldQuestion, label: 'Suspicious' },
  green: { box: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', Icon: ShieldCheck, label: 'Looks safe' },
};
const SEV = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-slate-100 text-slate-600' };

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function Result({ r, content }) {
  const t = THEME[r.level] || THEME.yellow;
  const urls = (r.extracted?.urls || []).map((u) => (typeof u === 'string' ? u : u.url)).filter(Boolean);
  const reps = [...(r.reputation?.numbers || []), ...(r.reputation?.hosts || [])].filter((x) => x.uniqueReporters > 0);
  return (
    <div className="mt-6 space-y-4">
      <div className={`rounded-2xl border p-5 ${t.box}`}>
        <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${t.text}`}><t.Icon className="h-5 w-5" /> {t.label}</div>
        <h2 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">{r.headline}</h2>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-medium text-slate-600"><span>Risk score</span><span>{r.riskScore}/100</span></div>
          <div className="mt-1 h-2.5 rounded-full bg-white/70"><div className={`h-2.5 rounded-full ${t.bar}`} style={{ width: `${r.riskScore}%` }} /></div>
        </div>
      </div>

      <Card className="space-y-5 p-5">
        <List title="Why we think so" items={r.reasons} />
        <List title="What you should do" items={r.whatToDo} />
      </Card>

      {r.ruleFindings?.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Link checks</h3>
          <ul className="space-y-2 text-sm">
            {r.ruleFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2"><span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV[f.severity] || SEV.low}`}>{f.severity}</span><span className="text-slate-700">{f.message}</span></li>
            ))}
          </ul>
        </Card>
      )}

      {reps.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Community reports</h3>
          <div className="space-y-2">{reps.map((x) => <ReputationRow key={x.value} item={x} />)}</div>
        </div>
      )}

      {r.similar?.matchCount > 0 && (
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Similar known scam messages</h3>
          <p className="text-sm text-slate-600">{r.similar.matchCount} similar {r.similar.matchCount === 1 ? 'report' : 'reports'} from {r.similar.uniqueReporters} {r.similar.uniqueReporters === 1 ? 'person' : 'people'}.</p>
          {r.similar.samples?.map((s, i) => <p key={i} className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">“{s}”</p>)}
        </Card>
      )}

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">What we found in the message</h3>
        <dl className="space-y-2 text-sm">
          {r.extracted?.scamTypeLabel && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-500">Type</dt><dd className="font-medium text-slate-800">{r.extracted.scamTypeLabel}</dd></div>}
          {r.extracted?.brand && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-500">Pretending to be</dt><dd className="font-medium text-slate-800">{r.extracted.brand}</dd></div>}
          {r.extracted?.numbers?.length > 0 && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-500">Numbers</dt><dd className="break-all font-mono text-slate-800">{r.extracted.numbers.join(', ')}</dd></div>}
          {urls.length > 0 && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-500">Links</dt><dd className="break-all font-mono text-slate-800">{urls.join(', ')}</dd></div>}
          {r.extracted?.summary && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-500">Summary</dt><dd className="text-slate-700">{r.extracted.summary}</dd></div>}
        </dl>
      </Card>

      {r.verdict !== 'safe' && (
        <Link to="/report" state={{ prefill: { message: content, numbers: r.extracted?.numbers || [], url: urls[0] || '', scamType: r.extracted?.scamType } }}>
          <Button className="w-full sm:w-auto">Report this to warn others</Button>
        </Link>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-3.5 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p>{r.disclaimer}</p>
          {r.analysisMode === 'fallback' && <p className="mt-1">AI analysis was unavailable, so a basic rule-based check was used.</p>}
        </div>
      </div>
    </div>
  );
}

export default function CheckPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (text.length < 3) return setError('Please paste a message, link or phone number to check.');
    setLoading(true); setError(''); setResult(null);
    try { setResult(await checkContent(text)); setChecked(text); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <PageShell narrow title="Check a message, link or number" subtitle="Paste anything suspicious. We compare it with community reports and known scam patterns.">
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); if (error) setError(''); }}
          rows={7}
          maxLength={2000}
          placeholder="e.g. Congratulations! You won Rs 500,000 in BISP lucky draw. Send your CNIC to 0300-1234567..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{content.length}/2000</span>
          <Button type="submit" disabled={loading} className="h-10 px-5">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</> : <><Search className="mr-2 h-4 w-4" />Check now</>}
          </Button>
        </div>
        <ErrorBox>{error}</ErrorBox>
      </form>
      {result && <Result r={result} content={checked} />}
    </PageShell>
  );
}
