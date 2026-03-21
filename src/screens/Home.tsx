import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Truck, Smartphone, ShieldCheck, Clock, ArrowRight, ChevronRight, Star, ShoppingBag } from 'lucide-react';

export function Home() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/20 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              Assistência Técnica Mobile
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
              BUSCAMOS E ENTREGAMOS SEU <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">CELULAR</span> COM RAPIDEZ
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              A PAULTECH EXPRESS é a solução definitiva para quem não tem tempo a perder. 
              Coleta segura, reparo especializado e entrega garantida.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/login?mode=register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 active:scale-95 group"
            >
              Solicitar Coleta
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all active:scale-95"
            >
              Acompanhar Pedido
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Clock className="w-8 h-8 text-cyan-400" />,
            title: "Horário de Funcionamento",
            desc: "Segunda a Sexta: 08:00 às 17:00. Sábado: 08:00 às 12:00."
          },
          {
            icon: <Smartphone className="w-8 h-8 text-blue-400" />,
            title: "Serviços Especializados",
            desc: "Coleta para reparo, entrega de celulares e venda de seminovos."
          },
          {
            icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
            title: "Segurança Garantida",
            desc: "Seu aparelho segurado durante todo o trajeto e manutenção."
          }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all group"
          >
            <div className="mb-6 p-3 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Best Products Section */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              OS MELHORES <br />
              <span className="text-blue-400">PRODUTOS</span> SEMINOVOS
            </h2>
            <p className="text-slate-400 max-w-xl">
              Seleção exclusiva de aparelhos revisados, com garantia e procedência garantida pela Paultech Express.
            </p>
          </div>
          <Link to="/login" className="flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors group">
            Ver catálogo completo
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "iPhone 15 Pro Max",
              price: "R$ 7.499",
              image: "https://picsum.photos/seed/iphone15/400/500",
              tag: "Novo",
              rating: 5
            },
            {
              name: "Samsung S24 Ultra",
              price: "R$ 6.299",
              image: "https://picsum.photos/seed/s24/400/500",
              tag: "Destaque",
              rating: 5
            },
            {
              name: "iPhone 14 Pro",
              price: "R$ 5.199",
              image: "https://picsum.photos/seed/iphone14/400/500",
              tag: "Oferta",
              rating: 4
            },
            {
              name: "Google Pixel 8 Pro",
              price: "R$ 4.899",
              image: "https://picsum.photos/seed/pixel8/400/500",
              tag: "Raro",
              rating: 5
            }
          ].map((product, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden hover:border-blue-500/30 transition-all"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest">
                    {product.tag}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{product.name}</h3>
                  <p className="text-2xl font-black text-white mt-1">{product.price}</p>
                </div>
                <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                  <ShoppingBag className="w-4 h-4" />
                  Comprar Agora
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services List */}
      <section className="bg-blue-600/10 border border-blue-500/20 rounded-[40px] p-8 md:p-16 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-400/20 blur-[100px] rounded-full" />
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              TECNOLOGIA QUE <br />
              <span className="text-blue-400">MOVIMENTA</span> SEU DIA
            </h2>
            <p className="text-slate-400">
              Não pare sua rotina por causa de um celular quebrado. Nós cuidamos de tudo para você, com a agilidade que o mundo moderno exige.
            </p>
            <ul className="space-y-4">
              {["Coleta em domicílio", "Orçamento rápido", "As melhores peças", "Entrega expressa"].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-1">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-50"
                >
                  <source src="https://assets.mixkit.co/videos/preview/mixkit-delivery-man-checking-his-phone-while-on-a-bike-4446-large.mp4" type="video/mp4" />
                  Seu navegador não suporta vídeos.
                </video>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Truck className="w-32 h-32 text-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
