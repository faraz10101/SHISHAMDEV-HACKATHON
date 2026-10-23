import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { PageShell } from '../../components/common/Bits';
import ProviderManager from '../components/ProviderManager';

// The backend protects /api/admin/* with the x-admin-key header (ADMIN_KEY from .env).
// The key is only kept for this browser tab (sessionStorage).
export default function AdminDashboardPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem('adminKey') || '');
  const [input, setInput] = useState('');

  const save = (e) => { e.preventDefault(); if (!input.trim()) return; sessionStorage.setItem('adminKey', input.trim()); setKey(input.trim()); setInput(''); };
  const lock = () => { sessionStorage.removeItem('adminKey'); setKey(''); };

  if (!key) {
    return (
      <PageShell narrow title="Admin panel" subtitle="Enter the ADMIN_KEY from your backend .env to manage AI providers.">
        <Card><form onSubmit={save} className="flex gap-2 p-5">
          <Input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Admin key" className="h-10" autoComplete="off" />
          <Button type="submit" className="h-10"><KeyRound className="mr-1.5 h-4 w-4" />Unlock</Button>
        </form></Card>
      </PageShell>
    );
  }
  return <ProviderManager adminKey={key} onLock={lock} />;
}
