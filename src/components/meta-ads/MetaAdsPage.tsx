import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import MetaAdsConnection from './MetaAdsConnection';
import MetaAdsDashboard from './MetaAdsDashboard';
import MetaAdsAnalysis from './MetaAdsAnalysis';
import { Button } from '../ui/Button';
import {
  getMetaConnectionStatus,
  syncMetaCampaigns,
  MetaConnectionStatus,
  MetaCampaign
} from '../../services/metaAdsService';

interface MetaAdsPageProps {
  userEmail: string;
  onBack: () => void;
}

export default function MetaAdsPage({ userEmail, onBack }: MetaAdsPageProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'dashboard' | 'analysis'>('connection');
  const [connectionStatus, setConnectionStatus] = useState<MetaConnectionStatus>({ isConnected: false });
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (userEmail) {
      fetchConnectionStatus();
    }
  }, [userEmail]);

  // Detecta retorno do OAuth do Facebook
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      // Remove o parâmetro da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname);
      // Atualiza o status e vai para a aba de dashboard
      fetchConnectionStatus().then(() => {
        setActiveTab('dashboard');
      });
    }
    if (params.get('meta_error')) {
      console.error('Meta connection error:', params.get('meta_error'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchConnectionStatus = async () => {
    setLoading(true);
    try {
      const status = await getMetaConnectionStatus(userEmail);
      setConnectionStatus(status);

      // If connected, fetch campaigns
      if (status.isConnected) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/meta/campaigns?user_email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/meta/analysis?user_email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const success = await syncMetaCampaigns(userEmail);
      if (success) {
        await fetchCampaigns();
        await fetchConnectionStatus();
      }
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto pt-12 space-y-8 pb-24 px-6"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-zinc-500 dark:text-zinc-400">Carregando...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pt-12 space-y-8 pb-24 px-6"
    >
      <div className="space-y-2">
        <Button variant="ghost" onClick={onBack} className="px-0 hover:bg-transparent -ml-1">
          <ArrowLeft className="w-4 h-4" /> Voltar às Ferramentas
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight dark:text-white">Meta Ads Analyzer</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Conecte sua conta do Meta Ads e receba análises inteligentes das suas campanhas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {connectionStatus.isConnected ? (
              <>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-full">
                  Conectado
                </span>
                <Button
                  variant="outline"
                  onClick={handleSync}
                  loading={syncing}
                  className="text-sm px-4 py-2"
                >
                  Sincronizar
                </Button>
              </>
            ) : (
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-full">
                Desconectado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(['connection', 'dashboard', 'analysis'] as const).map((tab) => (
          <button
            key={tab}
            className={`pb-3 px-4 font-medium capitalize transition-colors ${activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              } ${tab !== 'connection' && !connectionStatus.isConnected ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (tab === 'connection' || connectionStatus.isConnected) {
                setActiveTab(tab);
                if (tab === 'analysis' && !analysis) fetchAnalysis();
              }
            }}
            disabled={tab !== 'connection' && !connectionStatus.isConnected}
          >
            {tab === 'connection' ? 'Conexão' : tab === 'dashboard' ? 'Dashboard' : 'Análise IA'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'connection' && (
          <MetaAdsConnection
            userEmail={userEmail}
            onConnectionChange={fetchConnectionStatus}
          />
        )}
        {activeTab === 'dashboard' && (
          <MetaAdsDashboard campaigns={campaigns} />
        )}
        {activeTab === 'analysis' && (
          <MetaAdsAnalysis
            userEmail={userEmail}
            analysis={analysis}
            onRefresh={fetchAnalysis}
          />
        )}
      </div>
    </motion.div>
  );
}