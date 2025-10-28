import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🏢 Sukaj Prona</h1>
          <p className="text-slate-300">Menaxhim i pronave me qera</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Identifikohu
          </h2>
          <Suspense fallback={<div className="text-white text-center">Duke u ngarkuar...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          © 2025 Sukaj Properties. Të gjitha të drejtat e rezervuara.
        </p>
      </div>
    </div>
  );
}
