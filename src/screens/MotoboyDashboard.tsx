import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
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
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const fetchOrders = async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);

    try {
      // Available orders (waiting)
      const { data: availableData } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      // My orders (all)
      const { data: myData } = await supabase
        .from('orders')
        .select('*')
        .eq('motoboy_id', user.id)
        .order('updated_at', { ascending: false });

      if (availableData) setAvailableOrders(availableData as Order[]);
      if (myData) setMyOrders(myData as Order[]);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    const ordersSubscription = supabase
      .channel('motoboy-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
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
        updated_at: new Date().toISOString(),
      };

      if (order.status === 'waiting') {
        updateData.motoboy_id = user.id;
        updateData.motoboy_name = profile.name;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Erro ao atualizar pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  const activeMyOrders = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const historyOrders = myOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight uppercase">PAINEL DO MOTOBOY</h1>
            <button 
              onClick={() => fetchOrders(true)}
              className={`p-2 rounded-full hover:bg-white/5 text-slate-500 transition-all ${refreshing ? 'animate-spin text-blue-500' : ''}`}
            >
              <Truck className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400">Olá, {profile?.name}. Gerencie suas coletas e entregas em tempo real.</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 self-start">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'active' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Truck className="w-4 h-4" />
            Ativas
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Clock className="w-4 h-4" />
            Histórico
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 animate-pulse font-bold uppercase tracking-widest">Sincronizando...</p>
        </div>
      ) : tab === 'active' ? (
        <div className="space-y-12">
          {/* My Active Orders */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                Minhas Corridas
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs">{activeMyOrders.length}</span>
              </h2>
            </div>
            
            {activeMyOrders.length === 0 ? (
              <div className="p-12 rounded-[32px] bg-slate-900/30 border border-dashed border-white/10 text-center space-y-3">
                <Truck className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-slate-500 font-medium">Você não tem nenhuma corrida em andamento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMyOrders.map((order) => (
                  <OrderCard 
                    key={order.id}
                    order={order} 
                    onUpdate={() => updateStatus(order)} 
                    isUpdating={updatingId === order.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Available Orders */}
          <section className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
              <div className="w-2 h-8 bg-cyan-500 rounded-full" />
              Pedidos Disponíveis
              <span className="ml-2 px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs">{availableOrders.length}</span>
            </h2>
            
            {availableOrders.length === 0 ? (
              <div className="p-12 rounded-[32px] bg-slate-900/30 border border-dashed border-white/10 text-center space-y-3">
                <PackageCheck className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-slate-500 font-medium">Nenhum pedido aguardando coleta no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableOrders.map((order) => (
                  <OrderCard 
                    key={order.id}
                    order={order} 
                    onUpdate={() => updateStatus(order)} 
                    isUpdating={updatingId === order.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
            <div className="w-2 h-8 bg-slate-600 rounded-full" />
            Histórico de Entregas
          </h2>
          {historyOrders.length === 0 ? (
            <div className="p-12 rounded-[32px] bg-slate-900/30 border border-dashed border-white/10 text-center">
              <p className="text-slate-500">Nenhum histórico encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historyOrders.map((order) => (
                <OrderCard 
                  key={order.id}
                  order={order} 
                  onUpdate={() => {}} 
                  isUpdating={false}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function OrderCard({ order, onUpdate, isUpdating }: { order: Order, onUpdate: () => void | Promise<void>, isUpdating: boolean }) {
  const btn = STATUS_BUTTONS[order.status];
  const isHistory = order.status === 'delivered' || order.status === 'cancelled';

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
    window.open(url, '_blank');
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 border border-white/10 rounded-[32px] p-6 space-y-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20 group-hover:bg-blue-600 transition-colors" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 transition-colors">
            <Smartphone className={`w-6 h-6 ${order.problem.startsWith('COMPRA:') ? 'text-emerald-400' : 'text-blue-400'}`} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Cliente</p>
            <p className="text-slate-200 font-bold text-lg">{order.client_name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Status</p>
          <p className="text-cyan-400 text-xs font-black uppercase tracking-tighter">{order.status.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="space-y-4 bg-slate-950/50 p-5 rounded-[24px] border border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Descrição / Problema
          </p>
          <p className="text-sm text-slate-300 font-medium line-clamp-2">{order.problem}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Endereço de Entrega/Coleta
          </p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-300 leading-tight flex-1">{order.address}</p>
            <button 
              onClick={openInMaps}
              className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors"
              title="Ver no Mapa"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-500" />
            <p className="text-[10px] text-slate-500 font-bold">
              {order.created_at 
                ? format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })
                : 'Agora'}
            </p>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {!isHistory && (
        <button
          onClick={onUpdate}
          disabled={isUpdating || !STATUS_FLOW[order.status]}
          className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${btn.color}`}
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
      )}
    </motion.div>
  );
}
