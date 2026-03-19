import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Truck, Smartphone, ShieldCheck, Clock, ArrowRight, ChevronRight } from 'lucide-react';

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
              {["Coleta em domicílio", "Orçamento rápido", "Peças originais", "Entrega expressa"].map((text, i) => (
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
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/tech/600/600" 
                  alt="Tech" 
                  className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Truck className="w-32 h-32 text-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
