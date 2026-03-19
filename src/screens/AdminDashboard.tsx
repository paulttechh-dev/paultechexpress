import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, addDoc, getDocs, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { Order, UserProfile, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Package, Plus, X, Loader2, UserPlus, Mail, Lock, User, Trash2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboys, setMotoboys] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'motoboys' | 'stats'>('orders');
  
  // New Motoboy Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mbName, setMbName] = useState('');
  const [mbEmail, setMbEmail] = useState('');
  const [mbPassword, setMbPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const qMotoboys = query(collection(db, 'users'), where('role', '==', 'motoboy'));

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
      setLoading(false);
    });

    const unsubMotoboys = onSnapshot(qMotoboys, (snapshot) => {
      setMotoboys(snapshot.docs.map(doc => ({ ...doc.data() })) as UserProfile[]);
    });

    return () => {
      unsubOrders();
      unsubMotoboys();
    };
  }, [user, profile]);

  const handleCreateMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Note: In a real app, you'd use a Cloud Function to create users to avoid logging out the admin.
      // For this simulation, we'll just add to Firestore and assume the admin handles auth separately 
      // or we use a mock approach. 
      // Since we can't easily create another Auth user without logging out, 
      // we'll just simulate the Firestore entry for the demo.
      
      const tempId = 'mb_' + Math.random().toString(36).substr(2, 9);
      await addDoc(collection(db, 'users'), {
        uid: tempId,
        name: mbName,
        email: mbEmail,
        role: 'motoboy',
        createdAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      setMbName('');
      setMbEmail('');
      setMbPassword('');
      alert("Motoboy cadastrado com sucesso (Simulação Firestore)!");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar motoboy.");
    } finally {
      setCreating(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-slate-400 text-center max-w-xs">
          Esta área é restrita apenas para administradores da PAULTECH EXPRESS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            ADMINISTRAÇÃO
          </h1>
          <p className="text-slate-400">Gestão completa da PAULTECH EXPRESS.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'orders', label: 'Pedidos', icon: <Package className="w-4 h-4" /> },
            { id: 'motoboys', label: 'Motoboys', icon: <Users className="w-4 h-4" /> },
            { id: 'stats', label: 'Métricas', icon: <TrendingUp className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {tab === 'orders' && (
            <div className="bg-slate-900/50 border border-white/10 rounded-[32px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                      <th className="px-6 py-4">Pedido</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Motoboy</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-blue-400">#{order.id.slice(-6)}</p>
                          <p className="text-sm text-slate-300 truncate max-w-[150px]">{order.problem}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{order.clientName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-400">{order.motoboyName || 'Pendente'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            {['waiting', 'accepted', 'on_route', 'collected', 'in_maintenance', 'delivered', 'cancelled'].map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500">
                            {order.createdAt?.seconds 
                              ? format(new Date(order.createdAt.seconds * 1000), "dd/MM HH:mm")
                              : '--'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'motoboys' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  Cadastrar Motoboy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {motoboys.map((mb) => (
                  <div key={mb.uid} className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">{mb.name}</h3>
                      <p className="text-xs text-slate-500">{mb.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Pedidos', value: orders.length, color: 'text-blue-400' },
                { label: 'Entregues', value: orders.filter(o => o.status === 'delivered').length, color: 'text-emerald-400' },
                { label: 'Em Aberto', value: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, color: 'text-yellow-400' },
                { label: 'Motoboys', value: motoboys.length, color: 'text-cyan-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 text-center space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Motoboy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight">CADASTRAR MOTOBOY</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateMotoboy} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={mbName}
                      onChange={(e) => setMbName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="Nome do motoboy"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={mbEmail}
                      onChange={(e) => setMbEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="email@motoboy.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={mbPassword}
                      onChange={(e) => setMbPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  {creating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Cadastrar Motoboy
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
