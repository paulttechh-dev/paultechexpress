import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Plus, MapPin, Smartphone, Clock, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS: Record<OrderStatus, { label: string, color: string }> = {
  waiting: { label: 'Aguardando', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  accepted: { label: 'Aceito', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  on_route: { label: 'Em Rota', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  collected: { label: 'Coletado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  in_maintenance: { label: 'Em Manutenção', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function ClientDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [address, setAddress] = useState('');
  const [problem, setProblem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        clientId: user.uid,
        clientName: profile.name,
        address,
        problem,
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setAddress('');
      setProblem('');
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Erro ao solicitar coleta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">MEUS PEDIDOS</h1>
          <p className="text-slate-400">Olá, {profile?.name}. Acompanhe suas solicitações.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Solicitação
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 animate-pulse">Carregando seus pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold">Nenhum pedido encontrado</h3>
          <p className="text-slate-500 max-w-xs mx-auto">
            Você ainda não solicitou nenhuma coleta. Clique no botão acima para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 space-y-6 hover:border-blue-500/30 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_LABELS[order.status].color}`}>
                  {STATUS_LABELS[order.status].label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Problema</p>
                    <p className="text-slate-200 line-clamp-2">{order.problem}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Endereço</p>
                    <p className="text-slate-200 line-clamp-1">{order.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Solicitado em</p>
                    <p className="text-slate-200">
                      {order.createdAt?.seconds 
                        ? format(new Date(order.createdAt.seconds * 1000), "dd 'de' MMMM, HH:mm", { locale: ptBR })
                        : 'Agora mesmo'}
                    </p>
                  </div>
                </div>
              </div>

              {order.motoboyName && (
                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Motoboy: <span className="text-slate-200 font-bold">{order.motoboyName}</span>
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* New Order Modal */}
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
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight">NOVA SOLICITAÇÃO</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço de Coleta</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      placeholder="Rua, número, bairro, complemento..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Problema do Aparelho</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                    <textarea
                      required
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                      placeholder="Ex: Tela quebrada, não liga, bateria estufada..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Confirmar Solicitação
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
