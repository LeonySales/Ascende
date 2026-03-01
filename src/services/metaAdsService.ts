import { useState, useEffect, useCallback } from 'react';

export interface MetaConnection {
  id: string;
  user_email: string;
  ad_account_id: string;
  business_name: string;
  connected_at: string;
  last_sync_at: string | null;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget_remaining: number;
  raw_data: any;
  synced_at: string;
}

export interface MetaAnalysis {
  score_geral: number;
  resumo_executivo: string;
  alertas_criticos: Array<{
    campanha: string;
    problema: string;
    impacto: 'alto' | 'medio' | 'baixo';
    sugestao: string;
  }>;
  oportunidades: Array<{
    titulo: string;
    descricao: string;
    acao_recomendada: string;
    ganho_estimado: string;
  }>;
  metricas_destaque: {
    melhor_campanha: string;
    pior_campanha: string;
    metrica_preocupante: string;
    metrica_positiva: string;
  };
  proximos_passos: string[];
}

export interface MetaConnectionStatus {
  isConnected: boolean;
  connection?: MetaConnection;
  lastSync?: string;
  campaignsCount?: number;
}

// Redirect to OAuth
export const connectMetaAds = (userEmail: string) => {
  window.location.href = `/api/auth/meta?user_email=${encodeURIComponent(userEmail)}`;
};

// Check connection status
export const getMetaConnectionStatus = async (userEmail: string): Promise<MetaConnectionStatus> => {
  try {
    const response = await fetch(`/api/meta/connection-status?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) {
      if (response.status === 404) return { isConnected: false };
      throw new Error(`Failed to get connection status: ${response.status}`);
    }
    const data = await response.json();
    return {
      isConnected: true,
      connection: data.connection,
      lastSync: data.lastSync,
      campaignsCount: data.campaignsCount
    };
  } catch (error) {
    console.error('Error getting Meta connection status:', error);
    return { isConnected: false };
  }
};

// Sync Meta campaigns
export const syncMetaCampaigns = async (userEmail: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/meta/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail })
    });
    if (!response.ok) throw new Error(`Failed to sync campaigns: ${response.status}`);
    const result = await response.json();
    console.log(`Synced ${result.campaigns_synced} campaigns`);
    return true;
  } catch (error) {
    console.error('Error syncing Meta campaigns:', error);
    return false;
  }
};

// Get Meta analysis
export const getMetaAnalysis = async (userEmail: string): Promise<MetaAnalysis | null> => {
  try {
    const response = await fetch(`/api/meta/analysis?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get analysis: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting Meta analysis:', error);
    return null;
  }
};

// ✅ Fixed hook - useCallback prevents stale closure, isConnected removed from polling deps
export const useMetaConnection = (userEmail: string) => {
  const [status, setStatus] = useState<MetaConnectionStatus>({ isConnected: false });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    const connStatus = await getMetaConnectionStatus(userEmail);
    setStatus(connStatus);
    setLoading(false);
    return connStatus;
  }, [userEmail]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ✅ Polling uses ref-based check to avoid stale closure bug
  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      // Re-fetch silently every 30s regardless of current status
      getMetaConnectionStatus(userEmail).then(setStatus);
    }, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  return {
    status,
    loading,
    reconnect: fetchStatus
  };
};