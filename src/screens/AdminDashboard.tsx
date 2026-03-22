import React, { useState, useEffect, useCallback } from 'react';
import { supabase, handleFetchError } from '../supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../AuthContext';
import { Order, UserProfile, UserRole, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Package, Plus, X, Loader2, UserPlus, Mail, Lock, User, Trash2, TrendingUp, Clock, CheckCircle2, Bell, AlertTriangle, ShoppingBag, DollarSign, Image as ImageIcon, Tag, Hash, RefreshCcw, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboys, setMotoboys] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'motoboys' | 'products' | 'stats'>('orders');
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  
  // New Motoboy Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mbName, setMbName] = useState('');
  const [mbEmail, setMbEmail] = useState('');
  const [mbPassword, setMbPassword] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Edit Motoboy Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMotoboy, setEditingMotoboy] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updating, setUpdating] = useState(false);

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pImage, setPImage] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pStock, setPStock] = useState('');
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (!user) return;
    if (isManual) setRefreshing(true);

    console.log("[DEBUG] Admin: Iniciando busca de dados...");

    // Fetch Orders independently
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn("Aviso: Erro ao buscar pedidos:", ordersError.message);
      } else if (ordersData) {
        setOrders(ordersData as Order[]);
        console.log(`[DEBUG] Admin: ${ordersData.length} pedidos carregados.`);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar pedidos:", e);
    }

    // Fetch Motoboys independently
    try {
      console.log("[DEBUG] Admin: Buscando perfis de motoboy...");
      
      // Busca todos os perfis para garantir que nada seja filtrado erroneamente pelo RLS
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*');

      if (allProfilesError) {
        console.error("ERRO ao buscar perfis:", allProfilesError);
        if (allProfilesError.message.includes('permission denied')) {
          console.error("DICA: Execute o script SQL de permissões (is_admin).");
        }
      } 
      
      if (allProfiles) {
        console.log(`[DEBUG] Total de perfis encontrados: ${allProfiles.length}`);
        const filtered = allProfiles.filter(p => p.role === 'motoboy');
        console.log(`[DEBUG] Motoboys após filtro local: ${filtered.length}`);
        
        // Se não encontrou nenhum motoboy mas existem perfis, vamos logar os cargos existentes
        if (filtered.length === 0 && allProfiles.length > 0) {
          const roles = [...new Set(allProfiles.map(p => p.role))];
          console.log("[DEBUG] Cargos encontrados no banco:", roles);
        }

        setMotoboys(filtered as UserProfile[]);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar motoboys:", e);
    }

    // Fetch Products independently
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error("ERRO CRÍTICO ao buscar produtos:", productsError);
        handleFetchError(productsError);
        if (productsError.message?.includes('row-level security') || productsError.message?.includes('permission denied')) {
          alert("ERRO DE PERMISSÃO NOS PRODUTOS: Verifique as políticas RLS no Supabase.");
        }
      } else if (productsData) {
        setProducts(productsData as Product[]);
        console.log(`[DEBUG] Admin: ${productsData.length} produtos carregados.`);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar produtos:", e);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchData();

    // Subscribe to changes
    const ordersSubscription = supabase
      .channel('admin-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          setNewOrderAlert(newOrder);
          // Play notification sound if possible
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
          
          // Auto-hide alert after 10 seconds
          setTimeout(() => setNewOrderAlert(null), 10000);
        }
        fetchData();
      })
      .subscribe();

    const motoboysSubscription = supabase
      .channel('admin-motoboys')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();

    const productsSubscription = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(motoboysSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, [user, profile, fetchData]);

  const handleCreateMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // 0. Verificar se já está na lista local (evita requisições desnecessárias)
      if (motoboys.some(m => m.email.toLowerCase() === mbEmail.toLowerCase().trim())) {
        alert("Este motoboy já aparece na sua lista.");
        setIsModalOpen(false);
        return;
      }

      console.log("[DEBUG] Admin: Verificando se perfil já existe para:", mbEmail);
      
      // 1. Verificar se já existe um perfil com este e-mail
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', mbEmail.toLowerCase().trim())
        .maybeSingle();

      if (existingProfile) {
        console.log("[DEBUG] Perfil encontrado, atualizando para motoboy...");
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'motoboy',
            name: mbName || existingProfile.name 
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error("Erro ao atualizar perfil existente:", updateError);
          alert("Este e-mail já está cadastrado, mas não conseguimos atualizar o cargo dele. Verifique as permissões SQL.");
          return;
        }

        alert("Este usuário já possuía cadastro e foi transformado em Motoboy com sucesso!");
        setIsModalOpen(false);
        setMbName('');
        setMbEmail('');
        setMbPassword('');
        fetchData();
        return;
      }

      // 2. Se não existe perfil, tentamos criar a conta de Autenticação (Auth)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      console.log("[DEBUG] Admin: Criando nova conta no Auth para:", mbEmail);
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: mbEmail.toLowerCase().trim(),
        password: mbPassword,
        options: {
          data: {
            full_name: mbName,
            role: 'motoboy'
          }
        }
      });

      if (authError) {
        console.error("Erro no Auth:", authError);
        if (authError.message.includes('already registered')) {
          // Se já existe no Auth, tentamos ver se conseguimos ao menos criar o perfil 
          // (isso só funcionaria se soubéssemos o ID, mas o Supabase não retorna no erro)
          alert("ERRO: Este e-mail já está registrado no sistema de acesso (Auth).\n\nSOLUÇÃO: Peça para este motoboy fazer LOGIN (não cadastro) com a senha dele. O sistema criará o perfil de motoboy automaticamente no primeiro acesso.");
        } else {
          alert(`Erro ao criar conta de acesso: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        alert("Erro: Não foi possível gerar o usuário de acesso.");
        return;
      }

      // 3. Criar ou Atualizar Perfil no Banco de Dados (Profiles)
      const payload = {
        id: authData.user.id,
        name: mbName,
        email: mbEmail.toLowerCase().trim(),
        role: 'motoboy' as const,
        password: mbPassword, // Armazenamos a senha para visualização do admin
        created_at: new Date().toISOString()
      };

      console.log("[DEBUG] Tentando UPSERT de perfil:", payload);

      // Usamos UPSERT para garantir que, se o Trigger do banco já criou o perfil, 
      // nós apenas atualizamos o cargo para motoboy.
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) {
        console.warn("Erro no upsert (tentando update manual):", upsertError);
        
        // Se o upsert falhar, tentamos um update direto pelo ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'motoboy', name: mbName })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error("Erro fatal ao salvar perfil:", updateError);
          alert(`Conta criada, mas erro ao definir cargo: ${updateError.message}`);
        } else {
          alert("Motoboy cadastrado com sucesso (via atualização)!");
        }
      } else {
        console.log("[DEBUG] Perfil salvo/atualizado com sucesso.");
        alert("Motoboy cadastrado com sucesso!");
      }

      // Limpar formulário e fechar
      setIsModalOpen(false);
      setMbName('');
      setMbEmail('');
      setMbPassword('');
      fetchData();
      
    } catch (err: any) {
      console.error("Erro fatal:", err);
      alert("Erro inesperado no aplicativo: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMotoboy) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName,
          email: editEmail,
        })
        .eq('id', editingMotoboy.id);

      if (error) {
        handleFetchError(error);
        throw error;
      }

      setIsEditModalOpen(false);
      setEditingMotoboy(null);
      fetchData(); // Refresh list
    } catch (error) {
      handleFetchError(error);
      console.error(error);
      alert("Erro ao atualizar motoboy.");
    } finally {
      setUpdating(false);
    }
  };

  const deleteMotoboy = async (motoboyId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este motoboy? Isso não excluirá a conta de acesso dele, apenas o perfil de motoboy.")) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', motoboyId);
        
      if (error) {
        handleFetchError(error);
        throw error;
      }
      fetchData(); // Refresh list
    } catch (error) {
      handleFetchError(error);
      console.error(error);
      alert("Erro ao remover motoboy.");
    }
  };

  const openEditModal = (mb: UserProfile) => {
    setEditingMotoboy(mb);
    setEditName(mb.name);
    setEditEmail(mb.email || '');
    setIsEditModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setPName(product.name);
    setPDescription(product.description);
    setPPrice(product.price.toString());
    setPImage(product.image_url || '');
    setPCategory(product.category || '');
    setPStock(product.stock?.toString() || '0');
    setImagePreview(product.image_url || null);
    setIsEditProductModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert("ERRO: O bucket 'product-images' não foi encontrado. Crie um bucket chamado 'product-images' no menu Storage.");
        } else if (uploadError.message.includes('row-level security')) {
          alert("ERRO DE SEGURANÇA (RLS): Você precisa criar as políticas de acesso para o bucket 'product-images' no SQL Editor do Supabase.");
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice) {
      alert("Por favor, preencha o nome e o preço do produto.");
      return;
    }

    setProductActionLoading(true);
    try {
      let finalImageUrl = pImage || `https://picsum.photos/seed/${pName}/400/400`;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          // If image upload failed, we might want to stop or continue with default
          console.warn("Image upload failed, using fallback/default image.");
        }
      }

      const priceValue = parseFloat(pPrice);
      if (isNaN(priceValue)) {
        throw new Error("O preço deve ser um número válido.");
      }

      const stockValue = parseInt(pStock) || 0;

      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: pName,
            description: pDescription,
            price: priceValue,
            image_url: finalImageUrl,
            category: pCategory,
            stock: stockValue,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        handleFetchError(error);
        if (error.message.includes('relation "public.products" does not exist')) {
          alert("ERRO: A tabela 'products' não foi encontrada no seu banco de dados. Por favor, rode o comando SQL para criar a tabela.");
        } else if (error.message.includes('row-level security')) {
          alert("ERRO DE SEGURANÇA (RLS): Você precisa criar as políticas de acesso para a tabela 'products' no SQL Editor do Supabase.");
        }
        throw error;
      }

      setIsProductModalOpen(false);
      setPName('');
      setPDescription('');
      setPPrice('');
      setPImage('');
      setPCategory('');
      setPStock('');
      setImageFile(null);
      setImagePreview(null);
      fetchData();
      alert("Produto cadastrado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao cadastrar produto:", error);
      alert("Erro ao cadastrar produto: " + (error.message || "Verifique sua conexão."));
    } finally {
      setProductActionLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!pName || !pPrice) {
      alert("Por favor, preencha o nome e o preço do produto.");
      return;
    }

    setProductActionLoading(true);
    try {
      let finalImageUrl = pImage;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const priceValue = parseFloat(pPrice);
      if (isNaN(priceValue)) {
        throw new Error("O preço deve ser um número válido.");
      }

      const stockValue = parseInt(pStock) || 0;

      const { error } = await supabase
        .from('products')
        .update({
          name: pName,
          description: pDescription,
          price: priceValue,
          image_url: finalImageUrl,
          category: pCategory,
          stock: stockValue,
        })
        .eq('id', editingProduct.id);

      if (error) {
        handleFetchError(error);
        throw error;
      }

      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
      fetchData();
      alert("Produto atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      alert("Erro ao atualizar produto: " + (error.message || "Verifique sua conexão."));
    } finally {
      setProductActionLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
      if (error) {
        handleFetchError(error);
        throw error;
      }
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir produto.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) {
        handleFetchError(error);
        throw error;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const assignMotoboy = async (orderId: string, motoboyId: string, motoboyName: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          motoboy_id: motoboyId,
          motoboy_name: motoboyName,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) {
        handleFetchError(error);
        throw error;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
        
      if (error) {
        handleFetchError(error);
        throw error;
      }
      fetchData();
    } catch (error) {
      handleFetchError(error);
      console.error(error);
      alert("Erro ao excluir pedido.");
    }
  };

  if (profile?.role !== 'admin' && user?.email !== 'paulttechh@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">ACESSO NEGADO</h2>
          <p className="text-slate-400 max-w-xs mx-auto">
            Esta área é restrita apenas para administradores da PAULTECH EXPRESS.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all active:scale-95"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={() => {
              supabase.auth.signOut().then(() => window.location.href = '/login');
            }}
            className="w-full py-4 rounded-2xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-bold transition-all active:scale-95"
          >
            Sair e Trocar Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* New Order Notification Toast */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[200] w-full max-w-md"
          >
            <div className="bg-blue-600 border border-blue-400 rounded-3xl p-6 shadow-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-100 font-black uppercase tracking-widest">Novo Pedido Recebido!</p>
                <p className="text-white font-bold truncate">{newOrderAlert.client_name}</p>
                <p className="text-blue-200 text-xs truncate">{newOrderAlert.problem}</p>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status de Diagnóstico */}
      <div className="mb-8 p-4 bg-slate-900/80 border border-white/5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sessão Ativa</p>
            <p className="text-sm font-bold">{user?.email || 'Não logado'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-l border-white/5 pl-4">
          <div className={`w-3 h-3 rounded-full ${profile?.role === 'admin' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cargo no Banco</p>
            <p className="text-sm font-bold">{profile?.role || 'Carregando...'}</p>
          </div>
        </div>
        <button 
          onClick={() => fetchData(true)}
          className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
          title="Recarregar Dados"
        >
          <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              ADMINISTRAÇÃO
            </h1>
            <button 
              onClick={() => fetchData(true)}
              className={`p-2 rounded-full hover:bg-white/5 text-slate-500 transition-all ${refreshing ? 'animate-spin text-blue-500' : ''}`}
              title="Recarregar dados"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400">Gestão completa da PAULTECH EXPRESS.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'orders', label: 'Pedidos', icon: <Package className="w-4 h-4" /> },
            { id: 'motoboys', label: 'Motoboys', icon: <Users className="w-4 h-4" /> },
            { id: 'products', label: 'Produtos', icon: <ShoppingBag className="w-4 h-4" /> },
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
                          <p className={`text-sm truncate max-w-[150px] ${order.problem.startsWith('COMPRA:') ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                            {order.problem}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{order.client_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <select
                              value={order.motoboy_id || ''}
                              onChange={(e) => {
                                const mb = motoboys.find(m => m.id === e.target.value);
                                if (mb) assignMotoboy(order.id, mb.id, mb.name);
                              }}
                              className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Atribuir Motoboy</option>
                              {motoboys.map(mb => (
                                <option key={mb.id} value={mb.id}>{mb.name}</option>
                              ))}
                            </select>
                            {order.motoboy_name && (
                              <span className="text-[10px] text-blue-400 font-bold uppercase">{order.motoboy_name}</span>
                            )}
                          </div>
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
                            {order.created_at 
                              ? format(new Date(order.created_at), "dd/MM HH:mm")
                              : '--'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          >
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
              {/* Debug Section (Only for Admin) */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 text-[10px] font-mono space-y-2">
                <p className="text-slate-500 uppercase font-black">Diagnóstico de Banco</p>
                <div className="flex flex-wrap gap-4">
                  <p>Motoboys na Lista: <span className="text-blue-400">{motoboys.length}</span></p>
                  <p>Sessão Admin: <span className={user ? "text-green-400" : "text-red-400"}>{user ? "OK" : "ERRO"}</span></p>
                  <p>E-mail: <span className="text-slate-400">{user?.email}</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const { data, error } = await supabase.from('profiles').select('*');
                      if (error) console.error("Erro no debug:", error);
                      else console.table(data);
                      alert(`Total de perfis no banco (Geral): ${data?.length || 0}.\nMotoboys filtrados: ${motoboys.length}.\n\nSe o total geral for maior que 0 e a lista estiver vazia, execute o script SQL de permissões.`);
                    }}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                  >
                    Ver Todos os Perfis no Console
                  </button>
                  <button 
                    onClick={async () => {
                      const testId = Math.floor(Math.random() * 1000);
                      const testEmail = `motoboy_teste_${testId}@paultech.com`;
                      const testName = `Motoboy Teste ${testId}`;
                      const testPass = "123456";
                      
                      setMbName(testName);
                      setMbEmail(testEmail);
                      setMbPassword(testPass);
                      setIsModalOpen(true);
                      alert(`Dados de teste preenchidos!\nE-mail: ${testEmail}\nSenha: ${testPass}\n\nClique em "CADASTRAR" no formulário que abriu.`);
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-all font-bold"
                  >
                    + GERAR DADOS DE TESTE
                  </button>
                </div>
              </div>

              <div className="flex justify-end items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Total no Banco: <span className="text-blue-400">{motoboys.length}</span>
                </p>
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all active:scale-95 disabled:opacity-50"
                  title="Atualizar Lista"
                >
                  <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  Cadastrar Motoboy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {motoboys.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/30 border border-dashed border-white/10 rounded-[40px]">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-10 h-10 text-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tight">NENHUM MOTOBOY ENCONTRADO</p>
                      <p className="text-slate-500 text-sm max-w-xs">Você ainda não cadastrou nenhum motoboy ou eles não foram carregados corretamente.</p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                    >
                      Cadastrar Primeiro Motoboy
                    </button>
                  </div>
                ) : (
                  motoboys.map((mb) => (
                    <div key={mb.id} className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <User className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{mb.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{mb.email}</p>
                          {mb.password && (
                            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-slate-950/50 border border-white/5">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span className="text-[10px] font-mono text-blue-400 select-all">{mb.password}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(mb.password || '');
                                  alert('Senha copiada!');
                                }}
                                className="ml-auto p-1 hover:bg-white/5 rounded text-slate-500"
                                title="Copiar Senha"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button 
                          onClick={() => openEditModal(mb)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => deleteMotoboy(mb.id)}
                          className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Novo Produto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/30 border border-dashed border-white/10 rounded-[40px]">
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tight">NENHUM PRODUTO ENCONTRADO</p>
                      <p className="text-slate-500 text-sm max-w-xs">Você ainda não cadastrou nenhum produto ou a tabela 'products' não existe.</p>
                    </div>
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                    >
                      Cadastrar Primeiro Produto
                    </button>
                  </div>
                ) : products.map((product) => (
                  <div key={product.id} className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col">
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

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditProductModal(product)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* New Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
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
                <h2 className="text-2xl font-black tracking-tight">NOVO PRODUTO</h2>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    required
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    placeholder="Detalhes do produto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <input
                      type="text"
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Ex: Acessórios"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Estoque</label>
                    <input
                      type="number"
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Imagem do Produto</label>
                  <div className="flex flex-col gap-4">
                    {imagePreview && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); setPImage(''); }}
                          className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                      >
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-400 font-bold">{imageFile ? 'Trocar Imagem' : 'Selecionar Imagem'}</span>
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-xs text-slate-600 font-bold uppercase">OU URL:</span>
                      </div>
                      <input
                        type="url"
                        value={pImage}
                        onChange={(e) => { setPImage(e.target.value); if (!imageFile) setImagePreview(e.target.value); }}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-24 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={productActionLoading}
                  className="w-full py-4 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  {productActionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Cadastrar Produto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProductModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight">EDITAR PRODUTO</h2>
                <button 
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    required
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <input
                      type="text"
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Estoque</label>
                    <input
                      type="number"
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Imagem do Produto</label>
                  <div className="flex flex-col gap-4">
                    {imagePreview && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); setPImage(''); }}
                          className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="edit-product-image-upload"
                      />
                      <label
                        htmlFor="edit-product-image-upload"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                      >
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-400 font-bold">{imageFile ? 'Trocar Imagem' : 'Selecionar Imagem'}</span>
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-xs text-slate-600 font-bold uppercase">OU URL:</span>
                      </div>
                      <input
                        type="url"
                        value={pImage}
                        onChange={(e) => { setPImage(e.target.value); if (!imageFile) setImagePreview(e.target.value); }}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-24 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={productActionLoading}
                  className="w-full py-4 mt-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-600/20 active:scale-95"
                >
                  {productActionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Salvar Alterações'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Motoboy Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight">EDITAR MOTOBOY</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateMotoboy} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="email@motoboy.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-600/20 active:scale-95"
                >
                  {updating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Salvar Alterações
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
