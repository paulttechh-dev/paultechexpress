import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, handleFetchError } from '../supabase';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, Shield } from 'lucide-react';

export function Login() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'client' | 'motoboy'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'paulttechh@gmail.com',
        password: adminPassword,
      });
      
      if (signInError) throw signInError;
      
      if (data.user) {
        navigate('/admin');
      }
    } catch (err: any) {
      handleFetchError(err);
      console.error(err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Senha de administrador incorreta. Verifique se você já criou sua conta com o e-mail paulttechh@gmail.com e se a senha está correta.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        setError('Erro de acesso restrito: ' + (err.message || 'Verifique sua chave.'));
      }
      setShowAdminModal(false);
    } finally {
      setAdminLoading(false);
      setAdminPassword('');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError('Erro ao entrar com Google. Verifique se o provedor está habilitado no console.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: role,
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Check if a profile already exists for this email (pre-created by admin)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (existingProfile) {
            // Update the existing profile with the real auth.uid
            // We delete the old one and insert the new one to avoid PK update issues
            await supabase.from('profiles').delete().eq('id', existingProfile.id);
          }

          // Create user profile in Supabase table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email,
                name,
                role: email === 'paulttechh@gmail.com' ? 'admin' : role,
                created_at: new Date().toISOString()
              }
            ]);
          
          if (profileError) throw profileError;
        }
        
        if (role === 'motoboy') navigate('/motoboy');
        else navigate('/dashboard');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        if (data.user) {
          // Fetch profile to redirect correctly
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (profile.role === 'admin') navigate('/admin');
          else if (profile.role === 'motoboy') navigate('/motoboy');
          else navigate('/dashboard');
        }
      }
    } catch (err: any) {
      handleFetchError(err);
      console.error(err);
      const msg = err.message || '';
      
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Tente fazer login em vez de criar uma nova conta.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para o link de confirmação.');
      } else if (msg.includes('Password should be at least 6 characters')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(msg || 'Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/50 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">
            {mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'CRIE SUA CONTA'}
          </h2>
          <p className="text-slate-400 mb-6">
            {mode === 'login' 
              ? 'Acesse sua conta para gerenciar seus pedidos.' 
              : 'Junte-se à PAULTECH EXPRESS hoje mesmo.'}
          </p>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entrar como</span>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  role === 'client'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >
                CLIENTE
              </button>
              <button
                type="button"
                onClick={() => setRole('motoboy')}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  role === 'motoboy'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/20'
                } ${mode === 'register' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                disabled={mode === 'register'}
              >
                MOTOBOY
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Motoboys: O cadastro é realizado exclusivamente pela loja.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-slate-300">Senha</label>
              {mode === 'login' && (
                <button 
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError('Por favor, digite seu e-mail primeiro.');
                      return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) setError(error.message);
                    else alert('E-mail de recuperação enviado!');
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest font-bold"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-slate-900 text-xs text-slate-500 uppercase tracking-widest">Ou continue com</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            {mode === 'login' 
              ? 'Não tem uma conta? Cadastre-se' 
              : 'Já tem uma conta? Faça login'}
          </button>
        </div>

        {/* Admin Login Link */}
        <div className="mt-12 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-400"
          >
            <Shield className="w-3 h-3" /> Acesso Restrito
          </button>
        </div>

        {/* Admin Secret Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAdminModal(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] p-10 shadow-2xl text-center space-y-8"
            >
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                <Shield className="w-10 h-10 text-blue-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">ACESSO RESTRITO</h3>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Apenas Administradores</p>
                <p className="text-slate-600 text-[10px] italic">Certifique-se de ter criado sua conta com o e-mail paulttechh@gmail.com primeiro.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-center tracking-[0.5em]"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {adminLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validar Chave'}
                </button>
              </form>

              <button 
                onClick={() => setShowAdminModal(false)}
                className="text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest font-bold"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
