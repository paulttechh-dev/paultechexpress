import React, { useState, useEffect } from 'react';
import { supabase, handleFetchError } from '../supabase';
import { useAuth } from '../AuthContext';
import { Order, OrderStatus, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Plus, MapPin, Smartphone, Clock, CheckCircle2, AlertCircle, Loader2, X, ShoppingBag, Tag, Hash, Info, RefreshCcw } from 'lucide-react';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'shop'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [address, setAddress] = useState('');
  const [problem, setProblem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);
    
    console.log("[DEBUG] Cliente: Iniciando busca de dados...");

    // Fetch Orders independently
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn("Aviso: Erro ao buscar seus pedidos:", ordersError.message);
      } else if (ordersData) {
        setOrders(ordersData as Order[]);
        console.log(`[DEBUG] Cliente: ${ordersData.length} pedidos encontrados.`);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar pedidos:", e);
    }

    // Fetch Products independently
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error("ERRO CRÍTICO ao buscar produtos da loja:", productsError);
        handleFetchError(productsError);
        if (productsError.message?.includes('row-level security') || productsError.message?.includes('permission denied')) {
          alert("ERRO DE PERMISSÃO NA LOJA: Verifique as políticas RLS no Supabase.");
        }
      } else if (productsData) {
        setProducts(productsData as Product[]);
        console.log(`[DEBUG] Cliente: ${productsData.length} produtos encontrados na loja.`);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar produtos:", e);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user) return;

    fetchData();

    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel('client-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const productsSubscription = supabase
      .channel('client-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            client_id: user.id,
            client_name: profile.name,
            address,
            problem,
            status: 'waiting',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
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

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmCancel = window.confirm("Deseja realmente cancelar este pedido?");
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      fetchData();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Erro ao cancelar pedido. Tente novamente.");
    }
  };

  const handleBuyProduct = async (product: Product) => {
    if (!user || !profile) return;
    
    const confirmBuy = window.confirm(`Deseja solicitar a compra de: ${product.name} por R$ ${product.price.toFixed(2)}?`);
    if (!confirmBuy) return;

    const userAddress = prompt("Por favor, confirme seu endereço para entrega:", address);
    if (!userAddress) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            client_id: user.id,
            client_name: profile.name,
            address: userAddress,
            problem: `COMPRA: ${product.name} (R$ ${product.price.toFixed(2)})`,
            status: 'waiting',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      alert("Pedido de compra realizado com sucesso! Acompanhe em 'Meus Pedidos'.");
      setIsProductDetailOpen(false);
      setTab('orders');
      fetchData();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      alert("Erro ao processar compra. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight uppercase">{tab === 'orders' ? 'MEUS PEDIDOS' : 'LOJA DE PEÇAS'}</h1>
            <button 
              onClick={() => fetchData(true)}
              className={`p-2 rounded-full hover:bg-white/5 text-slate-500 transition-all ${refreshing ? 'animate-spin text-blue-500' : ''}`}
              title="Recarregar dados"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400">Olá, {profile?.name}. {tab === 'orders' ? 'Acompanhe suas solicitações.' : 'Confira nossos produtos e peças disponíveis.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setTab('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Package className="w-4 h-4" />
              Pedidos
            </button>
            <button
              onClick={() => setTab('shop')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'shop' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Loja
            </button>
          </div>
          {tab === 'orders' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nova Solicitação</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 animate-pulse">Carregando...</p>
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
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
                        {order.created_at 
                          ? format(new Date(order.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })
                          : 'Agora mesmo'}
                      </p>
                    </div>
                  </div>
                </div>

                {order.motoboy_name && (
                  <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Motoboy: <span className="text-slate-200 font-bold">{order.motoboy_name}</span>
                    </p>
                  </div>
                )}

                {order.status === 'waiting' && (
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all border border-red-500/20"
                    >
                      Cancelar Pedido
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-3xl border border-white/5">
            <div className="relative w-full md:max-w-md">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                placeholder="Buscar produtos, peças ou categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest">
              <Hash className="w-4 h-4" />
              {filteredProducts.length} produtos encontrados
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold">Nenhum produto encontrado</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Não encontramos nenhum produto que corresponda à sua busca. Tente outros termos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <p className="text-sm font-black text-blue-400">R$ {product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{product.category || 'Geral'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Estoque: {product.stock || 0}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => openProductDetail(product)}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-blue-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <Info className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {isProductDetailOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductDetailOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400 z-10" />
              
              <button 
                onClick={() => setIsProductDetailOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/50 backdrop-blur-md text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative">
                <img 
                  src={selectedProduct.image_url || `https://picsum.photos/seed/${selectedProduct.name}/600/600`} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 left-6 bg-blue-600 px-4 py-2 rounded-2xl shadow-xl shadow-blue-600/30">
                  <p className="text-xl font-black text-white">R$ {selectedProduct.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 space-y-6 flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                      {selectedProduct.category || 'Geral'}
                    </span>
                    {selectedProduct.stock && selectedProduct.stock > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Em Estoque
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        Esgotado
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-tight">{selectedProduct.name}</h2>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</p>
                  <p className="text-slate-300 leading-relaxed">{selectedProduct.description}</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Estoque Disponível</span>
                    <span className="text-white font-black">{selectedProduct.stock || 0} unidades</span>
                  </div>
                  
                  <button 
                    onClick={() => handleBuyProduct(selectedProduct)}
                    disabled={submitting || !selectedProduct.stock || selectedProduct.stock <= 0}
                    className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-lg hover:bg-blue-500 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'COMPRAR AGORA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
