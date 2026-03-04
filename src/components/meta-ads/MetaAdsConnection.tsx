import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { connectMetaAds, syncMetaCampaigns, useMetaConnection } from '../../services/metaAdsService';
import { API_URL } from '../../config';
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface MetaAdsConnectionProps {
  userEmail: string;
  error?: string | null;
  onConnectionChange?: () => void;
}

const MetaAdsConnection: React.FC<MetaAdsConnectionProps> = ({ userEmail, error, onConnectionChange }) => {
  const { status, loading, reconnect } = useMetaConnection(userEmail);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = () => {
    connectMetaAds(userEmail);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMetaCampaigns(userEmail);
      await reconnect();
      onConnectionChange?.();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/api/meta/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail })
      });
      await reconnect();
      onConnectionChange?.();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-zinc-500 dark:text-zinc-400">Verificando conexão...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Conexão Meta Ads</h3>
        <button
          onClick={() => reconnect()}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Verificar status"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>
            {error === 'access_denied'
              ? 'Permissão negada. Você precisa autorizar o acesso no Facebook para conectar.'
              : `Erro na conexão: ${error}`}
          </span>
        </div>
      )}

      {!status.isConnected ? (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold dark:text-white mb-2">Conecte sua conta do Meta Ads</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Conecte sua conta para sincronizar automaticamente suas campanhas e receber análises inteligentes com IA.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Leitura segura das métricas de campanhas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Análise automática via IA</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Sincronização a cada 6 horas</span>
                </div>
              </div>
              <Button onClick={handleConnect} variant="secondary" className="mt-4 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Conectar Meta Ads
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold dark:text-white mb-1">Conta conectada com sucesso!</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                {status.connection?.business_name || 'Conta do Meta Ads'} • Ativa
              </p>
              {status.lastSync && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Última sincronização: {new Date(status.lastSync).toLocaleString('pt-BR')}
                </p>
              )}
              {status.campaignsCount !== undefined && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  {status.campaignsCount} campanhas sincronizadas
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSync} variant="secondary" className="text-sm px-4 py-2" loading={syncing}>
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar Agora
                </Button>
                <Button variant="danger" className="text-sm px-4 py-2" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaAdsConnection;