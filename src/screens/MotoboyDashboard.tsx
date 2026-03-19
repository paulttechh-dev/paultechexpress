import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Order, OrderStatus } from '../types';
import { motion } from 'motion/react';
import { Truck, MapPin, Smartphone, Clock, CheckCircle2, Loader2, Navigation, PackageCheck, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  waiting: 'accepted',
  accepted: 'on_route',
  on_route: 'collected',
  collected: 'in_maintenance',
  in_maintenance: 'delivered',
  delivered: null,
  cancelled: null,
};

const STATUS_BUTTONS: Record<OrderStatus, { label: string, icon: any, color: string }> = {
  waiting: { label: 'Aceitar Corrida', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-blue-600 hover:bg-blue-500' },
  accepted: { label: 'Iniciar Rota', icon: <Navigation className="w-5 h-5" />, color: 'bg-cyan-600 hover:bg-cyan-500' },
  on_route: { label: 'Confirmar Coleta', icon: <PackageCheck className="w-5 h-5" />, color: 'bg-purple-600 hover:bg-purple-500' },
  collected: { label: 'Entregar na Loja', icon: <Wrench className="w-5 h-5" />, color: 'bg-orange-600 hover:bg-orange-500' },
  in_maintenance: { label: 'Coletar para Entrega', icon: <Truck className="w-5 h-5" />, color: 'bg-blue-600 hover:bg-blue-500' },
  delivered: { label: 'Finalizado', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-600' },
  cancelled: { label: 'Cancelado', icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-red-600' },
};

export function MotoboyDashboard() {
  const { user, profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Available orders (waiting)
    const qAvailable = query(
      collection(db, 'orders'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );

    // My active orders
    const qMy = query(
      collection(db, 'orders'),
      where('motoboyId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
      setLoading(false);
    });

    const unsubMy = onSnapshot(qMy, (snapshot) => {
      setMyOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    return () => {
      unsubAvailable();
      unsubMy();
    };
  }, [user]);

  const updateStatus = async (order: Order) => {
    if (!user || !profile) return;
    
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    setUpdatingId(order.id);
    try {
      const updateData: any = {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      };

      if (order.status === 'waiting') {
        updateData.motoboyId = user.uid;
        updateData.motoboyName = profile.name;
      }

      await updateDoc(doc(db, 'orders', order.id), updateData);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Erro ao atualizar pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">PAINEL DO MOTOBOY</h1>
          <p className="text-slate-400">Olá, {profile?.name}. Gerencie suas entregas.</p>
        </div>
      </div>

      {/* Active Orders */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-400" />
          Minhas Corridas Ativas
        </h2>
        
        {myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/30 border border-white/5 text-center text-slate-500">
            Nenhuma corrida ativa no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map((order) => (
              <div key={order.id}>
                <OrderCard 
                  order={order} 
                  onUpdate={() => updateStatus(order)} 
                  isUpdating={updatingId === order.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Orders */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PackageCheck className="w-6 h-6 text-cyan-400" />
          Pedidos Disponíveis
        </h2>
        
        {availableOrders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/30 border border-white/5 text-center text-slate-500">
            Nenhum pedido aguardando coleta.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableOrders.map((order) => (
              <div key={order.id}>
                <OrderCard 
                  order={order} 
                  onUpdate={() => updateStatus(order)} 
                  isUpdating={updatingId === order.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderCard({ order, onUpdate, isUpdating }: { order: Order, onUpdate: () => void | Promise<void>, isUpdating: boolean }) {
  const btn = STATUS_BUTTONS[order.status];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 space-y-6 hover:border-blue-500/30 transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-blue-500/10 transition-colors">
            <Smartphone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Cliente</p>
            <p className="text-slate-200 font-bold">{order.clientName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status Atual</p>
          <p className="text-cyan-400 text-xs font-bold uppercase">{order.status.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{order.address}</p>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            {order.createdAt?.seconds 
              ? format(new Date(order.createdAt.seconds * 1000), "dd/MM HH:mm", { locale: ptBR })
              : 'Agora'}
          </p>
        </div>
      </div>

      <button
        onClick={onUpdate}
        disabled={isUpdating || !STATUS_FLOW[order.status]}
        className={`w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${btn.color}`}
      >
        {isUpdating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {btn.icon}
            {btn.label}
          </>
        )}
      </button>
    </motion.div>
  );
}
