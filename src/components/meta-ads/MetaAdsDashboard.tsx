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

const MetaAdsDashboard: React.FC<MetaAdsDashboardProps> = ({ campaigns }) => {
  const [period, setPeriod] = useState<'7d' | '15d' | '30d'>('30d');
  const [filter, setFilter] = useState<string>('all');

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
        <h3 className="text-xl font-bold dark:text-white">Dashboard de Campanhas</h3>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7d' | '15d' | '30d')}
              className="pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white font-light appearance-none bg-white"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="15d">Últimos 15 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gasto Total</p>
              <p className="text-lg font-bold dark:text-white">R$ {totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Impressões</p>
              <p className="text-lg font-bold dark:text-white">{totalImpressions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cliques</p>
              <p className="text-lg font-bold dark:text-white">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">CTR Médio</p>
              <p className="text-lg font-bold dark:text-white">{avgCTR.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <h4 className="font-bold dark:text-white">Campanhas ({campaigns.length})</h4>
        
        {campaigns.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <AlertTriangle className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">Nenhuma campanha encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign, index) => {
              const insights = campaign.raw_data?.insights || {};
              const status = campaign.status.toLowerCase();
              const statusColor = 
                status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                status === 'paused' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
              
              return (
                <div 
                  key={campaign.id} 
                  className="p-5 bg-white dark:bg-[#111111] border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-bold dark:text-white truncate max-w-xs md:max-w-md">{campaign.name}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Objetivo:</span>{' '}
                          <span className="font-medium dark:text-white">{campaign.objective}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Orçamento:</span>{' '}
                          <span className="font-medium dark:text-white">R$ {campaign.budget_remaining?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-fit">
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Gasto</p>
                        <p className="font-bold dark:text-white">R$ {(parseFloat(insights.spend) || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">ROAS</p>
                        <p className="font-bold dark:text-white">{(parseFloat(insights.roas) || 0).toFixed(2)}x</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">CTR</p>
                        <p className="font-bold dark:text-white">{(parseFloat(insights.ctr) || 0).toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">CPC</p>
                        <p className="font-bold dark:text-white">R$ {(parseFloat(insights.cpc) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaAdsDashboard;