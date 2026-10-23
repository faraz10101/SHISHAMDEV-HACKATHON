import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search, Copy, Check, FileText } from 'lucide-react';
import { lookupReputation, getComplaint } from '../api/scamshield';
import { COMPLAINT_MIN_REPORTERS } from '../constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageShell, ErrorBox, ReputationRow } from '../components/common/Bits';

function ComplaintBox({ target }) {
  const [state, setState] = useState({ loading: false, text: '', error: '', copied: false });

  const generate = async () => {
    setState({ loading: true, text: '', error: '', copied: false });
    try { const d = await getComplaint(target); setState({ loading: false, text: d.text, error: '', copied: false }); }
    catch (e) { setState({ loading: false, text: '', error: e.message, copied: false }); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(state.text); setState((s) => ({ ...s, copied: true })); setTimeout(() => setState((s) => ({ ...s, copied: false })), 2000); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {!state.text && (
        <Button size="sm" variant="outline" onClick={generate} disabled={state.loading}>
          {state.loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Preparing...</> : <><FileText className="mr-1.5 h-3.5 w-3.5" />Get complaint summary</>}
        </Button>
      )}
      {state.error && <div className="mt-2"><ErrorBox>{state.error}</ErrorBox></div>}
      {state.text && (
        <div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{state.text}</pre>
          <Button size="sm" className="mt-2" onClick={copy}>{state.copied ? <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy text</>}</Button>
        </div>
      )}
    </div>
  );
}

export default function LookupPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const run = useCallback(async (value) => {
    const v = value.trim();
    if (v.length < 3) return setError('Please enter a phone number or a link.');
    setLoading(true); setError(''); setResult(null);
    try { setResult(await lookupReputation(v)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Opened from a link like /lookup?q=0300... -> search straight away
  useEffect(() => { if (initial) run(initial); }, [initial, run]);

  const submit = (e) => { e.preventDefault(); setParams(q.trim() ? { q: q.trim() } : {}); if (q.trim() === initial) run(q); };

  const items = result ? [...result.numbers, ...result.hosts] : [];

  return (
    <PageShell narrow title="Look up a number or link" subtitle="Quick community reputation check (no AI). See how many different people reported it.">
      <form onSubmit={submit} className="flex gap-2">
        <Input value={q} onChange={(e) => { setQ(e.target.value); if (error) setError(''); }} placeholder="0300-1234567 or example.com" className="h-10 flex-1" />
        <Button type="submit" disabled={loading} className="h-10">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-1.5 h-4 w-4" />Look up</>}</Button>
      </form>

      <div className="mt-4 space-y-3">
        <ErrorBox>{error}</ErrorBox>
        {result && items.map((x) => (
          <ReputationRow key={x.value} item={x}>
            {x.uniqueReporters >= COMPLAINT_MIN_REPORTERS && <ComplaintBox target={x.value} />}
            {x.uniqueReporters > 0 && x.uniqueReporters < COMPLAINT_MIN_REPORTERS && (
              <p className="mt-2 text-xs text-slate-400">A complaint summary unlocks at {COMPLAINT_MIN_REPORTERS} different reporters.</p>
            )}
            {x.uniqueReporters === 0 && <p className="mt-2 text-xs text-slate-400">No one has reported this yet. That does not guarantee it is safe.</p>}
          </ReputationRow>
        ))}
      </div>
    </PageShell>
  );
}
