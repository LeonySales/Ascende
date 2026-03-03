import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MetaAdsDashboardProps {
  campaigns: any[];
}

const CampaignDetailAnalysis = ({ campaignId }: { campaignId: string }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('ascende_user_email');
      const response = await fetch(`${API_URL}/api/meta/campaign-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail, campaign_id: campaignId })
      });
      if (response.ok) {
        setAnalysis(await response.json());
      }
    } catch (error) {
      console.error('Single campaign analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (analysis) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Análise de IA Concluída</span>
            <div className="h-px w-8 bg-zinc-800" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-indigo-400">{analysis.score}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Score</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Target className="w-3 h-3" /> Diagnóstico
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">{analysis.diagnosis}</p>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Análise de Copy</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{analysis.copy_analysis}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Ajuste Crítico
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed font-bold">{analysis.critical_fix}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Próximos Passos</p>
              <div className="space-y-2">
                {analysis.next_steps?.map((step: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAnalyze}
      loading={loading}
      variant="secondary"
      className="w-full py-3 text-xs flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
    >
      <Zap className="w-4 h-4" />
      Analisar Campanha com IA
    </Button>
  );
};

const MetaAdsDashboard: React.FC<MetaAdsDashboardProps> = ({ campaigns }) => {
  const [period, setPeriod] = useState<'7d' | '15d' | '30d'>('30d');
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate summary metrics
  const totalSpent = campaigns.reduce((sum, camp) => {
    const insights = camp.raw_data?.insights;
    return sum + (parseFloat(insights?.spend) || 0);
  }, 0);

  const totalImpressions = campaigns.reduce((sum, camp) => {
    const insights = camp.raw_data?.insights;
    return sum + (parseInt(insights?.impressions) || 0);
  }, 0);

  const totalClicks = campaigns.reduce((sum, camp) => {
    const insights = camp.raw_data?.insights;
    return sum + (parseInt(insights?.clicks) || 0);
  }, 0);

  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard de Campanhas</h3>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7d' | '15d' | '30d')}
              className="pl-10 pr-10 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white font-bold text-sm appearance-none bg-white"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="15d">Últimos 15 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gasto Total', value: `R$ ${totalSpent.toFixed(2)}`, icon: DollarSign, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { label: 'Impressões', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Cliques', value: totalClicks.toLocaleString(), icon: MousePointerClick, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'CTR Médio', value: `${avgCTR.toFixed(2)}%`, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
        ].map((stat) => (
          <div key={stat.label} className="premium-card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <h4 className="font-bold text-zinc-900 dark:text-white">Campanhas ({campaigns.length})</h4>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <AlertTriangle className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">Nenhuma campanha encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const insights = campaign.raw_data?.insights || {};
              const status = campaign.status.toLowerCase();
              const isExpanded = expandedId === campaign.id;

              const statusColor =
                status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  status === 'paused' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

              return (
                <div
                  key={campaign.id}
                  className={`premium-card p-5 transition-all cursor-pointer ${isExpanded ? 'border-indigo-500 ring-1 ring-indigo-500/20' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" onClick={() => setExpandedId(isExpanded ? null : campaign.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-bold text-zinc-900 dark:text-white truncate max-w-xs md:max-w-md">{campaign.name}</h5>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                          {campaign.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Objetivo:</span>{' '}
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{campaign.objective}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Orçamento:</span>{' '}
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {campaign.budget_remaining?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 min-w-fit">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gasto</p>
                        <p className="font-bold text-zinc-900 dark:text-white">R$ {(parseFloat(insights.spend) || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ROAS</p>
                        <p className="font-bold text-zinc-900 dark:text-white">{(parseFloat(insights.roas) || 0).toFixed(2)}x</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CTR</p>
                        <p className="font-bold text-zinc-900 dark:text-white">{(parseFloat(insights.ctr) || 0).toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CPC</p>
                        <p className="font-bold text-zinc-900 dark:text-white">R$ {(parseFloat(insights.cpc) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CPM</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">R$ {(parseFloat(insights.cpm) || 0).toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Alcance</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{(parseInt(insights.reach) || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Frequência</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{(parseFloat(insights.frequency) || 0).toFixed(2)}x</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Impressões</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{(parseInt(insights.impressions) || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cliques</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{(parseInt(insights.clicks) || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      {insights.actions && insights.actions.length > 0 && (
                        <div className="mt-6">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Principais Ações</p>
                          <div className="flex flex-wrap gap-2">
                            {insights.actions.slice(0, 5).map((action: any) => (
                              <div key={action.action_type} className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 lowercase">{action.action_type.replace(/_/g, ' ')}:</span>
                                <span className="ml-2 text-xs font-bold text-zinc-900 dark:text-white">{parseInt(action.value).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h6 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Criativos e Textos</h6>
                          <div className="space-y-3">
                            {campaign.raw_data?.ads?.data?.slice(0, 2).map((ad: any, i: number) => (
                              <div key={i} className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-2">
                                <p className="text-xs font-bold text-white">{ad.name}</p>
                                <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                                  {ad.creative?.body || ad.creative?.title || 'Sem texto disponível'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h6 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Públicos e Interesses</h6>
                          <div className="space-y-3">
                            {campaign.raw_data?.adsets?.data?.slice(0, 2).map((adset: any, i: number) => (
                              <div key={i} className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                                <p className="text-xs font-bold text-white mb-1">{adset.name}</p>
                                <div className="flex flex-wrap gap-1">
                                  {adset.targeting?.flexible_spec?.[0]?.interests?.slice(0, 3).map((it: any, j: number) => (
                                    <span key={j} className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">{it.name}</span>
                                  ))}
                                  {!adset.targeting?.flexible_spec?.[0]?.interests && <span className="text-[9px] text-zinc-500 italic">Público Aberto / Remarketing</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <CampaignDetailAnalysis campaignId={campaign.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div >
  );
};

export default MetaAdsDashboard;