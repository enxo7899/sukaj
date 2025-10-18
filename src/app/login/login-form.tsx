'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Email ose fjalëkalim i gabuar');
        return;
      }

      if (data.user) {
        toast.success('U identifikuat me sukses!');
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="sukaj@admin.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Fjalëkalimi</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        disabled={loading}
      >
        {loading ? 'Duke u identifikuar...' : 'Identifikohu'}
      </Button>

      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">
          Nëse keni harruar fjalëkalimin, kontaktoni administratorin.
        </p>
      </div>
    </form>
  );
}
