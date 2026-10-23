import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { submitReport } from '../api/scamshield';
import { SCAM_TYPES, SCAM_LABELS } from '../constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { PageShell, ErrorBox, SuccessBox, ReputationRow } from '../components/common/Bits';
import { useAuth } from '../context/AuthContext';

const EMPTY = { message: '', numbers: '', url: '', amountLost: '', city: '', scamType: '' };

export default function ReportPage() {
  const { setPendingEmail } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const pre = state?.prefill;

  const [form, setForm] = useState(pre ? {
    ...EMPTY, message: pre.message || '', numbers: (pre.numbers || []).join(', '),
    url: pre.url || '', scamType: SCAM_TYPES.includes(pre.scamType) ? pre.scamType : '',
  } : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); if (error) setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    const numbers = form.numbers.split(/[,\n]/).map((n) => n.trim()).filter(Boolean).slice(0, 5);
    const message = form.message.trim();
    const url = form.url.trim();
    if (message.length < 20 && !numbers.length && !url) {
      return setError("Please include the scammer's phone number, the link, or the full message text (20+ characters).");
    }
    const payload = { message, numbers, url };
    if (form.amountLost !== '') payload.amountLost = Number(form.amountLost);
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.scamType) payload.scamType = form.scamType;

    setLoading(true); setError('');
    try {
      setDone(await submitReport(payload));
      setForm(EMPTY);
    } catch (err) {
      if (err.action === 'login') return navigate('/login', { state: { from: '/report' } });
      if (err.action === 'verify') { if (err.email) setPendingEmail(err.email); return navigate('/verify'); }
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (done) {
    const { reputation, complaintReady } = done.data;
    const items = [...reputation.numbers, ...reputation.hosts];
    return (
      <PageShell narrow title="Report sent">
        <SuccessBox>{done.message}</SuccessBox>
        {items.length > 0 && (
          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Current community status</h2>
            {items.map((x) => (
              <ReputationRow key={x.value} item={x}>
                {x.uniqueReporters >= 20 && <Link to={`/lookup?q=${encodeURIComponent(x.value)}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Get complaint summary →</Link>}
              </ReputationRow>
            ))}
          </div>
        )}
        {complaintReady && <p className="mt-4 rounded-xl bg-indigo-50 p-3.5 text-sm text-indigo-800">Enough people reported this. A ready-to-copy complaint summary is available on the Lookup page.</p>}
        <div className="mt-6 flex gap-2">
          <Button onClick={() => setDone(null)}>Report another</Button>
          <Link to="/"><Button variant="outline">Back to home</Button></Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell narrow title="Report a scam" subtitle="Add at least one of: the full message (20+ characters), the scammer's number, or the link. Personal details are removed from stored messages.">
      <Card>
        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          <ErrorBox>{error}</ErrorBox>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message text</Label>
            <textarea id="message" name="message" value={form.message} onChange={set} rows={5} maxLength={2000} disabled={loading}
              placeholder="Paste the scam SMS / WhatsApp message here"
              className="w-full resize-y rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="numbers">Scammer phone number(s)</Label>
              <Input id="numbers" name="numbers" value={form.numbers} onChange={set} disabled={loading} placeholder="0300-1234567, 0321-7654321" />
              <p className="text-xs text-slate-400">Separate with commas (max 5)</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">Link</Label>
              <Input id="url" name="url" value={form.url} onChange={set} disabled={loading} maxLength={300} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amountLost">Amount lost (Rs, optional)</Label>
              <Input id="amountLost" name="amountLost" type="number" min="0" value={form.amountLost} onChange={set} disabled={loading} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" name="city" value={form.city} onChange={set} disabled={loading} maxLength={60} placeholder="Karachi" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scamType">Scam type</Label>
            <select id="scamType" name="scamType" value={form.scamType} onChange={set} disabled={loading}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Let ScamShield detect it</option>
              {SCAM_TYPES.map((t) => <option key={t} value={t}>{SCAM_LABELS[t]}</option>)}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit report</>}
          </Button>
          <p className="text-center text-xs text-slate-400">One report per person for the same number, link or message.</p>
        </form>
      </Card>
    </PageShell>
  );
}
