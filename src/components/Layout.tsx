import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogOut, User, Package, Shield, Truck } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              PAULTECH <span className="text-cyan-400">EXPRESS</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4 mr-4 text-sm text-slate-400">
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                      <Shield className="w-4 h-4" /> Painel Admin
                    </Link>
                  )}
                  {profile?.role === 'motoboy' && (
                    <Link to="/motoboy" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                      <Truck className="w-4 h-4" /> Entregas
                    </Link>
                  )}
                  {profile?.role === 'client' && (
                    <Link to="/dashboard" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                      <Package className="w-4 h-4" /> Meus Pedidos
                    </Link>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} PAULTECH EXPRESS. Tecnologia em assistência técnica.
          </p>
        </div>
      </footer>
    </div>
  );
}
