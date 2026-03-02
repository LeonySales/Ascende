import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  CheckCircle2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getMetaAnalysis } from '../../services/metaAdsService';

interface MetaAdsAnalysisProps {
  userEmail: string;
  analysis: any | null;
  onRefresh: () => void;
  loading?: boolean;
}

const MetaAdsAnalysis: React.FC<MetaAdsAnalysisProps> = ({
  userEmail,
  analysis,
  onRefresh,
  loading = false
}) => {
  const [localAnalysis, setLocalAnalysis] = useState<any>(analysis);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (analysis) setLocalAnalysis(analysis);
  }, [analysis]);

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const newAnalysis = await getMetaAnalysis(userEmail);
      setLocalAnalysis(newAnalysis);
      onRefresh();
    } catch (error) {
      console.error('Error generating analysis:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderScoreGauge = (score: number) => {
    const percentage = Math.min(100, Math.max(0, score));
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
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
          <span className="text-2xl font-bold dark:text-white">{score}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">de 100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Análise por IA</h3>
        <div className="flex gap-3">
          <Button onClick={handleGenerateAnalysis} variant="secondary" className="flex items-center gap-2" loading={isGenerating}>
            <Sparkles className="w-4 h-4" />
            Gerar Nova Análise
          </Button>
          <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2" loading={loading}>
            <RotateCcw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {localAnalysis ? (
        <>
          {/* Score + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 flex justify-center">
              {renderScoreGauge(localAnalysis.score_geral ?? 0)}
            </div>
            <div className="lg:col-span-3">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-zinc-900 dark:text-white">Resumo Executivo</h4>
                </div>
                <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed font-medium">{localAnalysis.resumo_executivo}</p>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {localAnalysis.alertas_criticos?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Alertas Críticos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localAnalysis.alertas_criticos.map((alert: any, index: number) => (
                  <div key={index} className="p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className={`w-5 h-5 ${alert.impacto === 'alto' ? 'text-red-500' : alert.impacto === 'medio' ? 'text-amber-500' : 'text-blue-500'}`} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold dark:text-white text-sm">{alert.campanha}</h5>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${alert.impacto === 'alto' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              alert.impacto === 'medio' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>{alert.impacto}</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-2">{alert.problema}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{alert.sugestao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {localAnalysis.oportunidades?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-500" /> Oportunidades
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localAnalysis.oportunidades.map((opportunity: any, index: number) => (
                  <div key={index} className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-grow">
                        <h5 className="font-bold dark:text-white mb-1">{opportunity.titulo}</h5>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{opportunity.descricao}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">{opportunity.acao_recomendada}</span>
                          <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded">{opportunity.ganho_estimado}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {localAnalysis.metricas_destaque && (
            <div className="space-y-4">
              <h4 className="font-bold dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Métricas em Destaque
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Melhor Campanha', value: localAnalysis.metricas_destaque.melhor_campanha },
                  { label: 'Pior Campanha', value: localAnalysis.metricas_destaque.pior_campanha },
                  { label: 'Métrica Preocupante', value: localAnalysis.metricas_destaque.metrica_preocupante },
                  { label: 'Métrica Positiva', value: localAnalysis.metricas_destaque.metrica_positiva },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="font-medium dark:text-white text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {localAnalysis.proximos_passos?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Próximos Passos
              </h4>
              <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                <ol className="space-y-3">
                  {localAnalysis.proximos_passos.map((step: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {index + 1}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h4 className="font-bold dark:text-white mb-2">Nenhuma análise disponível</h4>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Conecte sua conta do Meta Ads e sincronize suas campanhas para gerar uma análise por IA.
          </p>
          <Button onClick={handleGenerateAnalysis} variant="secondary" loading={isGenerating} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar Análise
          </Button>
        </div>
      )}
    </div>
  );
};

export default MetaAdsAnalysis;