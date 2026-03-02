import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Zap,
  BarChart3,
  FileText,
  Megaphone,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Target,
  DollarSign
} from 'lucide-react';
import { Button } from './ui/Button';
import ReactMarkdown from 'react-markdown';

interface ToolsPageProps {
  activeProject: any;
  onBack: () => void;
  onGoToMetaAds: () => void;
  onGenerateCopy: () => void;
  onGenerateAds: () => void;
  loadingCopy: boolean;
  loadingAds: boolean;
  extraResult: string;
  extraTool: 'copy' | 'ads' | null;
}

// Demo analysis data for when there's no real Meta connection
const DEMO_ANALYSIS = {
  score_geral: 72,
  resumo_executivo: "Suas campanhas têm um desempenho acima da média, mas há oportunidades claras de otimização no conjunto de anúncios de remarketing. O CTR está bom, porém o CPC pode ser reduzido em ~18% com ajustes de segmentação.",
  alertas_criticos: [
    {
      campanha: "Campanha Conversões - Produto X",
      problema: "Frequência acima de 3.2 — audiência com fadiga de anúncio",
      impacto: "alto" as const,
      sugestao: "Expanda a audiência ou renove os criativos imediatamente"
    },
    {
      campanha: "Remarketing - Visitantes 30 dias",
      problema: "ROAS de 1.4x abaixo do break-even estimado de 2.0x",
      impacto: "medio" as const,
      sugestao: "Reduza o orçamento diário em 40% e teste novos ângulos de copy"
    }
  ],
  oportunidades: [
    {
      titulo: "Lookalike de compradores recentes",
      descricao: "Sua audiência de compradores dos últimos 30 dias tem volume suficiente para criar um Lookalike 1% com alto potencial de conversão.",
      acao_recomendada: "Criar Lookalike 1% agora",
      ganho_estimado: "+25% em conversões"
    },
    {
      titulo: "Horário de pico inexplorado",
      descricao: "Suas conversões se concentram entre 19h-22h, mas o orçamento está distribuído igualmente ao longo do dia.",
      acao_recomendada: "Ativar programação de anúncios",
      ganho_estimado: "-15% no CPA"
    }
  ],
  metricas_destaque: {
    melhor_campanha: "Topo de Funil - Awareness",
    pior_campanha: "Remarketing - Visitantes 30 dias",
    metrica_preocupante: "Frequência média: 3.2",
    metrica_positiva: "CTR médio: 2.8% (acima da média do setor)"
  },
  proximos_passos: [
    "Renovar criativos da campanha de remarketing nos próximos 3 dias",
    "Criar audiência Lookalike 1% baseada em compradores recentes",
    "Ativar programação de anúncios para focar no horário 19h-22h",
    "Testar 2 novos ângulos de copy focados em prova social",
    "Revisar orçamento: mover 30% do remarketing para Lookalike"
  ]
};

export default function ToolsPage({
  activeProject,
  onBack,
  onGoToMetaAds,
  onGenerateCopy,
  onGenerateAds,
  loadingCopy,
  loadingAds,
  extraResult,
  extraTool
}: ToolsPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'meta-demo' | 'copy'>('overview');
  const [analysis] = useState(DEMO_ANALYSIS);

  const renderScoreGauge = (score: number) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    return (
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
          <circle
            cx="50" cy="50" r="45"
            stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-zinc-900 dark:text-white">{score}</span>
          <span className="text-[10px] text-zinc-500">/ 100</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto pt-12 space-y-8 pb-24 px-4"
    >
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" onClick={onBack} className="px-0 hover:bg-transparent -ml-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Ferramentas</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Recursos estratégicos para acelerar sua monetização.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'meta-demo', label: 'Meta Ads IA' },
          { id: 'copy', label: 'Copy & Anúncios' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === tab.id
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('meta-demo')}
            className="premium-card p-6 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Meta Ads Analyzer</h3>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Analise suas campanhas com IA e receba insights acionáveis</p>
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                  DEMO DISPONÍVEL
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('copy')}
            className="premium-card p-6 text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold dark:text-white">Copy Vendedora</h3>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gere textos persuasivos para vender seu produto ou serviço</p>
                {!activeProject && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                    REQUER PROJETO
                  </span>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('copy')}
            className="p-6 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-3xl text-left hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold dark:text-white">Ideias de Anúncios</h3>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Crie ideias criativas de anúncios para Meta e Google Ads</p>
                {!activeProject && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                    REQUER PROJETO
                  </span>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={onGoToMetaAds}
            className="p-6 bg-[#2D3250] dark:bg-[#1A1A24] border border-transparent rounded-3xl text-left hover:opacity-90 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Conectar Meta Ads</h3>
                  <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-white/60 mt-1">Conecte sua conta real para análise ao vivo das campanhas</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Tab: Meta Ads Demo */}
      {activeTab === 'meta-demo' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Análise por IA</h3>
              <p className="text-xs text-zinc-400 mt-1">Demonstração — conecte sua conta para análise real</p>
            </div>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                MODO DEMO
              </span>
              <Button onClick={onGoToMetaAds} variant="secondary" className="text-sm px-4 py-2">
                <Zap className="w-4 h-4" /> Conectar Conta Real
              </Button>
            </div>
          </div>

          {/* Score + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 flex justify-center items-center">
              {renderScoreGauge(analysis.score_geral)}
            </div>
            <div className="lg:col-span-3">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 h-full flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-zinc-900 dark:text-white">Resumo Executivo</h4>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm ai-content">
                  <ReactMarkdown>{analysis.resumo_executivo}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-3">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Alertas Críticos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.alertas_criticos.map((alert, index) => (
                <div key={index} className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className={`w-5 h-5 ${alert.impacto === 'alto' ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-bold dark:text-white text-sm">{alert.campanha}</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.impacto === 'alto'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{alert.impacto}</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-1">{alert.problema}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{alert.sugestao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className="space-y-3">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-500" /> Oportunidades
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.oportunidades.map((opp, index) => (
                <div key={index} className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-bold dark:text-white mb-1 text-sm">{opp.titulo}</h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{opp.descricao}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">{opp.acao_recomendada}</span>
                        <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded">{opp.ganho_estimado}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Métricas em Destaque
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Melhor Campanha', value: analysis.metricas_destaque.melhor_campanha },
                { label: 'Pior Campanha', value: analysis.metricas_destaque.pior_campanha },
                { label: 'Preocupante', value: analysis.metricas_destaque.metrica_preocupante },
                { label: 'Positivo', value: analysis.metricas_destaque.metrica_positiva },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-medium dark:text-white text-xs leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Próximos Passos
            </h4>
            <div className="premium-card p-6">
              <ol className="space-y-3">
                {analysis.proximos_passos.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {index + 1}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Copy & Ads */}
      {activeTab === 'copy' && (
        <div className="space-y-6">
          {!activeProject ? (
            <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h4 className="font-bold dark:text-white mb-2">Crie um projeto primeiro</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                As ferramentas de copy e anúncios precisam de um projeto ativo para gerar conteúdo personalizado.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-white">Copy Vendedora</h3>
                      <p className="text-xs text-zinc-400">Para {activeProject.idea}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Texto persuasivo pronto para usar em landing pages, WhatsApp e redes sociais.</p>
                  <Button onClick={onGenerateCopy} loading={loadingCopy} variant="secondary" className="w-full">
                    <Sparkles className="w-4 h-4" /> Gerar Copy
                  </Button>
                </div>

                <div className="premium-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-white">Ideias de Anúncios</h3>
                      <p className="text-xs text-zinc-400">Para {activeProject.idea}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Roteiros e ideias criativas para Meta Ads, Google e TikTok.</p>
                  <Button onClick={onGenerateAds} loading={loadingAds} variant="outline" className="w-full">
                    <Sparkles className="w-4 h-4" /> Gerar Anúncios
                  </Button>
                </div>
              </div>

              {extraResult && (
                <div className="space-y-3">
                  <h4 className="font-bold dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    {extraTool === 'copy' ? 'Copy Gerada' : 'Anúncios Gerados'}
                  </h4>
                  <div className="premium-card p-8 md:p-12 ai-content">
                    <ReactMarkdown>{extraResult}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}