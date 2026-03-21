import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { ClientDashboard } from './screens/ClientDashboard';
import { MotoboyDashboard } from './screens/MotoboyDashboard';
import { AdminDashboard } from './screens/AdminDashboard';
import { isSupabaseConfigured } from './supabase';
import { ShieldAlert } from 'lucide-react';

function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[40px] p-10 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Configuração Necessária</h1>
        <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
          <p>Para o funcionamento da <strong>PAULTECH EXPRESS</strong>, você precisa configurar o Supabase.</p>
          <div className="bg-slate-950 p-4 rounded-2xl text-left font-mono text-xs space-y-2 border border-white/5">
            <p className="text-blue-400"># Adicione no painel Secrets:</p>
            <p>VITE_SUPABASE_URL = "https://fmtriznhlamqnvgfqjhs.supabase.co"</p>
            <p>VITE_SUPABASE_ANON_KEY = "sua-anon-key"</p>
          </div>
          <p>Após adicionar as chaves, o aplicativo será reiniciado automaticamente.</p>
        </div>
        <a 
          href="https://supabase.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
        >
          Criar conta no Supabase
        </a>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard allowedRoles={['client']}>
                  <ClientDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/motoboy" 
              element={
                <AuthGuard allowedRoles={['motoboy']}>
                  <MotoboyDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminDashboard />
                </AuthGuard>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
