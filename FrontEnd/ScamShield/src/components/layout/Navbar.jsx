import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/check', label: 'Check' },
  { to: '/lookup', label: 'Lookup' },
  { to: '/report', label: 'Report' },
];

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`;

export default function Navbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"><ShieldCheck className="h-4.5 w-4.5" /></span>
          ScamShield
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>)}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="max-w-[120px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{user.username}</span>
            <Button onClick={onLogout} variant="outline" size="sm">Sign out</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register"><Button size="sm" className="bg-primary hover:bg-primary/90">Register</Button></Link>
          </div>
        )}
      </div>
    </header>
  );
}
