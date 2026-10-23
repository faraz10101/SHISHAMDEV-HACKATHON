import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, ShieldCheck, Sparkles, MapPin, TrendingUp, Phone, Clock } from 'lucide-react';
import { getFeed } from '../api/scamshield';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Spinner, ErrorBox, PageShell } from '../components/common/Bits';
import { useAuth } from '../context/AuthContext';

const fmtDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
const timeAgo = (d) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

function Stat({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      {children}
    </Card>
  );
}

const Empty = ({ text }) => <p className="text-sm text-slate-400">{text}</p>;

export default function HomePage() {
  const { user } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [city, setCity] = useState('');
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setFeed(await getFeed(city)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [city]);

  useEffect(() => { load(); }, [load]);

  const submitCity = (e) => { e.preventDefault(); setCity(cityInput.trim()); };

  const maxDay = feed ? Math.max(1, ...feed.last7Days.map((d) => d.reports)) : 1;
  const maxType = feed ? Math.max(1, ...feed.byType.map((d) => d.reports)) : 1;

  return (
    <PageShell>
      {/* Hero */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {user ? `Welcome, ${user.username}` : 'Scam weather today'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            What scammers are doing right now, based on reports from verified people{feed?.date ? ` · ${feed.date}` : ''}.
          </p>
        </div>
        <form onSubmit={submitCity} className="flex gap-2">
          <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Filter by city (e.g. Lahore)" className="h-10 w-full sm:w-56" />
          <Button type="submit" className="h-10"><Search className="mr-1.5 h-4 w-4" />Go</Button>
          {city && <Button type="button" variant="outline" className="h-10" onClick={() => { setCity(''); setCityInput(''); }}>Clear</Button>}
        </form>
      </div>

      {loading && !feed ? <Spinner label="Loading today's feed..." /> : error ? <ErrorBox onRetry={load}>{error}</ErrorBox> : feed && (
        <div className="space-y-4">
          {/* Bulletin */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-200">
              <ShieldAlert className="h-4 w-4" /> Today{feed.city ? ` in ${feed.city}` : ''}
              {feed.summaryMode === 'ai' && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 normal-case"><Sparkles className="h-3 w-3" />AI summary</span>}
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">{feed.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100">{feed.summary}</p>
            {feed.tips?.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-indigo-50">
                {feed.tips.map((t, i) => <li key={i} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t}</li>)}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/check"><Button className="bg-white text-indigo-700 hover:bg-indigo-50">Check a message</Button></Link>
              <Link to="/report"><Button variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white">Report a scam</Button></Link>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Reports today" value={feed.totals.reportsToday} />
            <Stat label="People targeted" value={feed.totals.peopleReported} />
            <Stat label="Reported loss" value={`Rs ${Number(feed.totals.reportedLossToday).toLocaleString('en-US')}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Section icon={Clock} title="Last 7 days">
              <div className="flex h-32 items-end gap-2">
                {feed.last7Days.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">{d.reports}</span>
                    <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(4, (d.reports / maxDay) * 80)}px` }} />
                    <span className="text-[10px] text-slate-400">{fmtDay(d.date)}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={ShieldAlert} title="Scam types today">
              {feed.byType.length === 0 ? <Empty text="No reports yet today." /> : (
                <div className="space-y-2.5">
                  {feed.byType.map((t) => (
                    <div key={t.type}>
                      <div className="flex justify-between text-xs"><span className="font-medium text-slate-700">{t.label}</span><span className="text-slate-500">{t.reports} · {t.people} {t.people === 1 ? 'person' : 'people'}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${(t.reports / maxType) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section icon={TrendingUp} title="Trending impersonations">
              {feed.trending.length === 0 ? <Empty text="Nothing trending right now." /> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {feed.trending.map((t, i) => (
                    <li key={i} className="flex items-center justify-between py-2"><div><p className="font-semibold text-slate-800">{t.brand}</p><p className="text-xs text-slate-500">{t.label}</p></div><span className="text-xs font-semibold text-slate-600">{t.reports} reports</span></li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={Phone} title="Most reported numbers today">
              {feed.topNumbers.length === 0 ? <Empty text="A number appears here once 3+ different people report it." /> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {feed.topNumbers.map((n) => (
                    <li key={n.number} className="flex items-center justify-between py-2">
                      <div><Link to={`/lookup?q=${encodeURIComponent(n.number)}`} className="font-mono font-semibold text-primary hover:underline">{n.number}</Link><p className="text-xs text-slate-500">{n.label}</p></div>
                      <span className="text-xs font-semibold text-slate-600">{n.uniqueReporters} people</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={MapPin} title="Top cities (7 days)">
              {feed.topCities.length === 0 ? <Empty text="No city data yet." /> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {feed.topCities.map((c) => <li key={c.city} className="flex justify-between py-2"><span className="font-medium text-slate-800">{c.city}</span><span className="text-xs font-semibold text-slate-600">{c.reports} reports</span></li>)}
                </ul>
              )}
            </Section>

            <Section icon={Clock} title="Latest reports">
              {feed.recent.length === 0 ? <Empty text="No reports yet today." /> : (
                <ul className="space-y-3">
                  {feed.recent.map((r, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">{r.label}{r.brand ? ` · ${r.brand}` : ''}</span><span>{r.city ? `${r.city} · ` : ''}{timeAgo(r.createdAt)}</span></div>
                      {r.snippet && <p className="mt-0.5 line-clamp-2 text-slate-600">{r.snippet}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </PageShell>
  );
}
