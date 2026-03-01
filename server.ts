import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";
import crypto from "crypto";
import axios from "axios";
import type { AxiosResponse } from "axios";
import cron from "node-cron";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";

// Define types for Meta API responses
interface MetaTokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
}

interface MetaAccount {
  account_id: string;
  name: string;
  account_status?: number;
  currency?: string;
}

interface MetaAccountsResponse {
  data?: MetaAccount[];
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget_remaining: string;
  insights?: any;
}

interface MetaCampaignsResponse {
  data?: MetaCampaign[];
}

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const db = new Database("ideas.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    idea TEXT,
    context TEXT,
    analysis TEXT,
    roadmap TEXT,
    completed_tasks TEXT DEFAULT '[]',
    status TEXT DEFAULT 'Em execução',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meta_connections (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    access_token TEXT NOT NULL,
    token_expires_at DATETIME,
    ad_account_id TEXT,
    business_name TEXT,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sync_at DATETIME,
    is_active BOOLEAN DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meta_campaigns (
    id TEXT PRIMARY KEY,
    connection_id TEXT,
    meta_campaign_id TEXT,
    name TEXT,
    status TEXT,
    objective TEXT,
    budget_remaining REAL,
    raw_data TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (connection_id) REFERENCES meta_connections(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meta_analyses (
    id TEXT PRIMARY KEY,
    connection_id TEXT,
    score_geral INTEGER,
    resumo_executivo TEXT,
    full_analysis TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    period_start DATETIME,
    period_end DATETIME,
    FOREIGN KEY (connection_id) REFERENCES meta_connections(id)
  )
`);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'", "https://generativelanguage.googleapis.com", "https://*.supabase.co", "https://graph.facebook.com"],
      },
    },
  }));
  app.use(hpp());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Muitas requisições deste IP, tente novamente após 15 minutos",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://appdesignerpro.site',
      'http://appdesignerpro.site'
    ],
    credentials: true
  }));

  app.use(express.json({ limit: '10kb' })); // Limit body size for security

  // API Routes
  app.get("/api/projects", (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email required" });
    try {
      const projects = db.prepare("SELECT * FROM projects WHERE user_email = ? ORDER BY created_at DESC").all(email);
      res.json(projects.map(p => ({
        ...p,
        context: JSON.parse(p.context),
        analysis: JSON.parse(p.analysis),
        roadmap: JSON.parse(p.roadmap),
        completed_tasks: JSON.parse(p.completed_tasks)
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post("/api/projects", (req, res) => {
    const { id, user_email, idea, context, analysis, roadmap } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO projects (id, user_email, idea, context, analysis, roadmap, completed_tasks, status) VALUES (?, ?, ?, ?, ?, ?, '[]', 'Em execução')");
      stmt.run(id, user_email, idea, JSON.stringify(context), JSON.stringify(analysis), JSON.stringify(roadmap));
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving project:', error);
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  app.patch("/api/projects/:id/tasks", (req, res) => {
    const { completed_tasks } = req.body;
    try {
      const stmt = db.prepare("UPDATE projects SET completed_tasks = ? WHERE id = ?");
      stmt.run(JSON.stringify(completed_tasks), req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating tasks:', error);
      res.status(500).json({ error: 'Failed to update tasks' });
    }
  });

  app.patch("/api/projects/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      const stmt = db.prepare("UPDATE projects SET status = ? WHERE id = ?");
      stmt.run(status, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.get("/api/projects/:id", (req, res) => {
    try {
      const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
      if (project) {
        project.context = JSON.parse(project.context);
        project.analysis = JSON.parse(project.analysis);
        project.roadmap = JSON.parse(project.roadmap);
        project.completed_tasks = JSON.parse(project.completed_tasks);
        res.json(project);
      } else {
        res.status(404).json({ error: "Project not found" });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Gemini Routes
  app.post("/api/analyze-idea", async (req, res) => {
    try {
      const { idea, context } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analise a seguinte ideia sob a ótica do "Caminho do Dinheiro". O foco é transformar essa ideia em renda extra real o mais rápido possível.\n        Ideia: ${idea}\n        Contexto do Usuário: ${JSON.stringify(context)}`,
        config: {
          systemInstruction: "Você é o ASCENDE, um mentor operacional sênior focado em monetização rápida. Sua missão é cortar o excesso de informação e focar no que gera dinheiro. Você deve responder claramente: 1. Onde está o dinheiro? 2. Qual o caminho mais curto para o primeiro ganho? 3. O que fazer hoje? Seja firme, diga 'não' para expansões de escopo desnecessárias. Use um tom experiente e direto.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              market: { type: Type.OBJECT, properties: { competition: { type: Type.STRING }, competitorTypes: { type: Type.ARRAY, items: { type: Type.STRING } }, barriers: { type: Type.STRING }, saturation: { type: Type.STRING } }, required: ["competition", "competitorTypes", "barriers", "saturation"] },
              viability: { type: Type.OBJECT, properties: { canStartFromZero: { type: Type.BOOLEAN }, technicalComplexity: { type: Type.STRING }, learningCurve: { type: Type.STRING }, capitalDependency: { type: Type.STRING } }, required: ["canStartFromZero", "technicalComplexity", "learningCurve", "capitalDependency"] },
              monetization: { type: Type.OBJECT, properties: { model: { type: Type.STRING }, firstGainPath: { type: Type.STRING }, estimatedTimeForFirstGain: { type: Type.STRING }, minimumFinancialGoal: { type: Type.STRING }, whereIsTheMoney: { type: Type.STRING } }, required: ["model", "firstGainPath", "estimatedTimeForFirstGain", "minimumFinancialGoal", "whereIsTheMoney"] },
              costs: { type: Type.OBJECT, properties: { minimum: { type: Type.STRING }, ideal: { type: Type.STRING }, tools: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["minimum", "ideal", "tools"] },
              scalability: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, automationPotential: { type: Type.STRING }, growthModel: { type: Type.STRING } }, required: ["level", "automationPotential", "growthModel"] },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              diagnosis: { type: Type.OBJECT, properties: { verdict: { type: Type.STRING, enum: ["Sim", "Não", "Ajustar"] }, initialApproach: { type: Type.STRING }, recommendedAdjustments: { type: Type.STRING }, safetyPath: { type: Type.STRING } }, required: ["verdict", "initialApproach", "recommendedAdjustments", "safetyPath"] }
            },
            required: ["market", "viability", "monetization", "costs", "scalability", "risks", "diagnosis"]
          }
        }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error('Error analyzing idea:', error);
      res.status(500).json({ error: 'Failed to analyze idea' });
    }
  });

  app.post("/api/generate-roadmap", async (req, res) => {
    try {
      const { idea, context, analysis } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Gere um cronograma de execução de 7 dias focado em MONETIZAÇÃO.\n        Ideia: ${idea}\n        Contexto: ${JSON.stringify(context)}\n        Análise: ${JSON.stringify(analysis)}`,
        config: {
          systemInstruction: "Você é um mentor operacional focado em lucro. Crie um plano que priorize ações com retorno financeiro rápido.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goals: { type: Type.OBJECT, properties: { minimum: { type: Type.STRING }, realistic: { type: Type.STRING }, desired: { type: Type.STRING }, maximum: { type: Type.STRING } }, required: ["minimum", "realistic", "desired", "maximum"] },
              financialMilestones: { type: Type.OBJECT, properties: { firstSale: { type: Type.STRING }, breakEven: { type: Type.STRING }, targetMonthly: { type: Type.STRING } }, required: ["firstSale", "breakEven", "targetMonthly"] },
              days: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.INTEGER }, title: { type: Type.STRING }, objective: { type: Type.STRING }, mentorContext: { type: Type.STRING }, practicalSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendedTools: { type: Type.ARRAY, items: { type: Type.STRING } }, decisionsToMake: { type: Type.ARRAY, items: { type: Type.STRING } }, expectedOutcome: { type: Type.STRING }, timeEstimate: { type: Type.STRING }, moneyFocus: { type: Type.STRING } }, required: ["day", "title", "objective", "mentorContext", "practicalSteps", "recommendedTools", "decisionsToMake", "expectedOutcome", "timeEstimate", "moneyFocus"] } }
            },
            required: ["goals", "financialMilestones", "days"]
          }
        }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error('Error generating roadmap:', error);
      res.status(500).json({ error: 'Failed to generate roadmap' });
    }
  });

  app.post("/api/generate-copy", async (req, res) => {
    try {
      const { idea, analysis } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Gere uma copy persuasiva para o seguinte projeto:\n        Projeto: ${idea}\n        Análise: ${JSON.stringify(analysis)}`,
        config: { systemInstruction: "Você é um copywriter sênior focado em conversão. Gere uma copy estruturada com Headline, Problema, Solução, Diferencial e CTA único." }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      res.json({ copy: responseText });
    } catch (error) {
      console.error('Error generating copy:', error);
      res.status(500).json({ error: 'Failed to generate copy' });
    }
  });

  app.post("/api/generate-ads", async (req, res) => {
    try {
      const { idea, analysis } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Gere 3 ideias de anúncios para o seguinte projeto:\n        Projeto: ${idea}\n        Análise: ${JSON.stringify(analysis)}`,
        config: { systemInstruction: "Você é um estrategista de tráfego pago. Gere ideias de criativos, ângulos de venda e estrutura de anúncio para testes iniciais." }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      res.json({ ads: responseText });
    } catch (error) {
      console.error('Error generating ads:', error);
      res.status(500).json({ error: 'Failed to generate ads' });
    }
  });

  app.post("/api/meta-ads-analysis", async (req, res) => {
    try {
      const { adData, useApi } = req.body;
      let analysisPrompt = `Analise a seguinte campanha de anúncios do Meta/Facebook e forneça recomendações detalhadas:\n${adData}`;
      if (useApi) analysisPrompt += "\n\nOs dados foram obtidos diretamente da API do Meta.";
      else analysisPrompt += "\n\nOs dados foram inseridos manualmente pelo usuário.";
      analysisPrompt += "\n\nForneça:\n1. Avaliação geral\n2. Pontos fortes\n3. Oportunidades de melhoria\n4. Recomendações específicas\n5. Novas ideias para testar";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisPrompt,
        config: { systemInstruction: "Você é um especialista sênior em tráfego pago do Meta. Avalie criticamente a campanha e forneça insights acionáveis." }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      res.json({ analysis: responseText });
    } catch (error) {
      console.error('Error analyzing Meta ads:', error);
      res.status(500).json({ error: 'Failed to analyze Meta ads' });
    }
  });

  // ✅ Meta Ads OAuth - COM DEBUG
  app.get("/api/auth/meta", (req, res) => {
    const { user_email } = req.query;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const isLocalhost = req.get('host')?.includes('localhost');
    const host = (process.env.APP_URL && !isLocalhost)
      ? process.env.APP_URL.replace(/^https?:\/\//, '')
      : req.get('host');
    const redirectUri = encodeURIComponent(`${protocol}://${host}/api/auth/meta/callback`);
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${redirectUri}&scope=public_profile,ads_read,ads_management,business_management&response_type=code&state=${encodeURIComponent(user_email as string || '')}`;

    // 🔍 DEBUG - aparece no terminal do servidor
    console.log('=== META AUTH DEBUG ===');
    console.log('META_APP_ID:', process.env.META_APP_ID);
    console.log('META_APP_SECRET exists:', !!process.env.META_APP_SECRET);
    console.log('user_email:', user_email);
    console.log('redirectUri (decoded):', decodeURIComponent(redirectUri));
    console.log('Full Auth URL:', authUrl);
    console.log('======================');

    res.redirect(authUrl);
  });

  app.get("/api/auth/meta/callback", async (req, res) => {
    const { code, state, error: fbError } = req.query;

    // Pega o email do state (passamos no redirect)
    const user_email = state ? decodeURIComponent(state as string) : 'unknown@example.com';

    console.log('=== META CALLBACK DEBUG ===');
    console.log('code exists:', !!code);
    console.log('user_email from state:', user_email);
    console.log('fbError:', fbError);
    console.log('===========================');

    if (fbError) {
      console.error('Facebook OAuth error:', fbError);
      return res.redirect('/tools?meta_error=' + fbError);
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const isLocalhost = req.get('host')?.includes('localhost');
    const host = (process.env.APP_URL && !isLocalhost)
      ? process.env.APP_URL.replace(/^https?:\/\//, '')
      : req.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/meta/callback`;

    try {
      const tokenResponse: AxiosResponse<MetaTokenResponse> = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code
        }
      });

      const shortLivedToken = tokenResponse.data.access_token;

      const longLivedResponse: AxiosResponse<MetaTokenResponse> = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });

      const longLivedToken = longLivedResponse.data.access_token;
      const expires_in = longLivedResponse.data.expires_in;
      const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      const accountsResponse: AxiosResponse<MetaAccountsResponse> = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: {
          access_token: longLivedToken,
          fields: 'account_id,name,account_status,currency'
        }
      });

      const personalAccounts = Array.isArray(accountsResponse.data.data) ? accountsResponse.data.data : [];
      console.log('Personal ad accounts found:', personalAccounts.length, personalAccounts.map(a => `${a.name} (${a.account_id})`));

      // Also fetch BM accounts
      let bmAccounts: MetaAccount[] = [];
      try {
        const bmResponse = await axios.get('https://graph.facebook.com/v18.0/me/businesses', {
          params: { access_token: longLivedToken, fields: 'id,name,owned_ad_accounts{account_id,name,account_status,currency}' }
        });
        const businesses = Array.isArray(bmResponse.data.data) ? bmResponse.data.data : [];
        console.log('Business Managers found:', businesses.length, businesses.map((b: any) => b.name));
        for (const biz of businesses) {
          const bmAds = biz.owned_ad_accounts?.data || [];
          console.log(`BM "${biz.name}" accounts:`, bmAds.map((a: any) => `${a.name} (${a.account_id})`));
          bmAccounts = bmAccounts.concat(bmAds);
        }
      } catch (bmErr: any) {
        console.warn('Could not fetch BM accounts:', bmErr?.response?.data?.error?.message || bmErr.message);
      }

      // Merge: prefer BM accounts, fall back to personal
      const allAccounts = [...bmAccounts, ...personalAccounts];
      console.log('Total accounts available:', allAccounts.length, allAccounts.map(a => `${a.name} (${a.account_id})`));

      const adAccountData = allAccounts;

      const encryptedToken = encryptToken(longLivedToken);

      // Remove previous connections for this user
      db.prepare(`UPDATE meta_connections SET is_active = 0 WHERE user_email = ?`).run(user_email);

      if (adAccountData.length === 0) {
        // Save without account if none found
        const connectionId = crypto.randomUUID();
        db.prepare(`INSERT INTO meta_connections (id, user_email, access_token, token_expires_at, ad_account_id, business_name, connected_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(connectionId, user_email, encryptedToken, tokenExpiresAt.toISOString(), null, 'No accounts found', new Date().toISOString());
      } else {
        // Save each account as a separate active connection; first one is "primary"
        for (const account of adAccountData) {
          const connectionId = crypto.randomUUID();
          db.prepare(`INSERT INTO meta_connections (id, user_email, access_token, token_expires_at, ad_account_id, business_name, connected_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(connectionId, user_email, encryptedToken, tokenExpiresAt.toISOString(), account.account_id, account.name, new Date().toISOString());
        }
      }

      console.log('✅ Meta connection saved successfully for:', user_email);
      const appBaseUrl = process.env.APP_URL || (req.get('host')?.includes('localhost') ? 'http://localhost:5173' : `https://${req.get('host')}`);
      res.redirect(`${appBaseUrl}/tools?meta_connected=true`);
    } catch (error: any) {
      console.error('Meta OAuth callback error:', error?.response?.data || error);
      const appBaseUrl = process.env.APP_URL || (req.get('host')?.includes('localhost') ? 'http://localhost:5173' : `https://${req.get('host')}`);
      res.redirect(`${appBaseUrl}/tools?meta_error=callback_failed`);
    }
  });

  app.get("/api/meta/campaigns", async (req, res) => {
    const { user_email } = req.query;
    try {
      const connection = db.prepare(`
        SELECT * FROM meta_connections 
        WHERE user_email = ? AND is_active = 1 
        ORDER BY connected_at DESC LIMIT 1
      `).get(user_email);
      if (!connection) return res.status(404).json({ error: 'No connection found' });

      const campaigns = db.prepare(`
        SELECT * FROM meta_campaigns 
        WHERE connection_id = ? 
        ORDER BY synced_at DESC
      `).all(connection.id);

      res.json(campaigns.map((c: any) => ({
        ...c,
        raw_data: JSON.parse(c.raw_data)
      })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  app.post("/api/meta/sync", async (req, res) => {
    const { user_email } = req.body;
    try {
      const connection = db.prepare(`SELECT * FROM meta_connections WHERE user_email = ? AND is_active = 1 ORDER BY connected_at DESC LIMIT 1`).get(user_email);
      if (!connection) return res.status(404).json({ error: 'No active Meta connection found' });
      const decryptedToken = decryptToken(connection.access_token);
      // Normalize ad_account_id — strip 'act_' prefix if present before adding it back
      const rawAccountId = String(connection.ad_account_id).replace(/^act_/, '');
      const campaignsResponse: AxiosResponse<MetaCampaignsResponse> = await axios.get(`https://graph.facebook.com/v18.0/act_${rawAccountId}/campaigns`, {
        params: {
          access_token: decryptedToken,
          fields: 'id,name,status,objective,budget_remaining,insights{spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions}',
          date_preset: 'last_30d'
        }
      });
      const campaignsList = Array.isArray(campaignsResponse.data.data) ? campaignsResponse.data.data : [];
      db.prepare('DELETE FROM meta_campaigns WHERE connection_id = ?').run(connection.id);
      for (const campaign of campaignsList) {
        db.prepare(`INSERT INTO meta_campaigns (id, connection_id, meta_campaign_id, name, status, objective, budget_remaining, raw_data, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          crypto.randomUUID(), connection.id, campaign.id, campaign.name, campaign.status, campaign.objective,
          parseFloat(campaign.budget_remaining || "0"), JSON.stringify(campaign), new Date().toISOString()
        );
      }
      db.prepare('UPDATE meta_connections SET last_sync_at = ? WHERE id = ?').run(new Date().toISOString(), connection.id);
      res.json({ success: true, campaigns_synced: campaignsList.length });
    } catch (error: any) {
      console.error('Meta sync error:', error?.response?.data || error);
      res.status(500).json({ error: 'Failed to sync Meta campaigns' });
    }
  });

  app.get("/api/meta/analysis", async (req, res) => {
    const { user_email } = req.query;
    try {
      const connection = db.prepare(`SELECT * FROM meta_connections WHERE user_email = ? AND is_active = 1 ORDER BY connected_at DESC LIMIT 1`).get(user_email);
      if (!connection) return res.status(404).json({ error: 'No active Meta connection found' });
      const campaigns = db.prepare(`SELECT * FROM meta_campaigns WHERE connection_id = ? ORDER BY synced_at DESC`).all(connection.id);
      if (!campaigns || campaigns.length === 0) return res.status(404).json({ error: 'No campaign data found' });
      const analysisData = {
        campaigns: campaigns.map(c => JSON.parse(c.raw_data)),
        connectionInfo: { businessName: connection.business_name, lastSync: connection.last_sync_at }
      };
      const systemPrompt = `Você é um especialista em tráfego pago com 10 anos de experiência em Meta Ads. Analise os dados das campanhas fornecidos e retorne SOMENTE um JSON válido com a seguinte estrutura:
      {"score_geral": number, "resumo_executivo": string, "alertas_criticos": [{"campanha": string, "problema": string, "impacto": "alto|medio|baixo", "sugestao": string}], "oportunidades": [{"titulo": string, "descricao": string, "acao_recomendada": string, "ganho_estimado": string}], "metricas_destaque": {"melhor_campanha": string, "pior_campanha": string, "metrica_preocupante": string, "metrica_positiva": string}, "proximos_passos": [string]}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analise os dados das campanhas do Meta Ads:\n${JSON.stringify(analysisData, null, 2)}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
      });
      const responseText = response.text;
      if (!responseText) return res.status(500).json({ error: 'Empty response from AI service' });
      const parsedAnalysis = JSON.parse(responseText);
      db.prepare(`INSERT INTO meta_analyses (id, connection_id, score_geral, resumo_executivo, full_analysis, generated_at, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        crypto.randomUUID(), connection.id, parsedAnalysis.score_geral, parsedAnalysis.resumo_executivo,
        JSON.stringify(parsedAnalysis), new Date().toISOString(),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString()
      );
      res.json(parsedAnalysis);
    } catch (error) {
      console.error('Meta analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze Meta campaigns' });
    }
  });

  app.get("/api/meta/connection-status", async (req, res) => {
    const { user_email } = req.query;
    try {
      const connection = db.prepare(`SELECT * FROM meta_connections WHERE user_email = ? AND is_active = 1 ORDER BY connected_at DESC LIMIT 1`).get(user_email);
      if (!connection) return res.status(404).json({ error: 'No active Meta connection found' });
      const campaigns = db.prepare(`SELECT COUNT(*) as count FROM meta_campaigns WHERE connection_id = ?`).get(connection.id);
      res.json({
        isConnected: true,
        connection: { id: connection.id, user_email: connection.user_email, ad_account_id: connection.ad_account_id, business_name: connection.business_name, connected_at: connection.connected_at, last_sync_at: connection.last_sync_at },
        lastSync: connection.last_sync_at,
        campaignsCount: campaigns.count
      });
    } catch (error) {
      console.error('Meta connection status error:', error);
      res.status(500).json({ error: 'Failed to get connection status' });
    }
  });

  app.post("/api/meta/disconnect", (req, res) => {
    const { user_email } = req.body;
    try {
      db.prepare(`UPDATE meta_connections SET is_active = 0 WHERE user_email = ?`).run(user_email);
      console.log('🔌 Meta disconnected for:', user_email);
      res.json({ success: true });
    } catch (error) {
      console.error('Meta disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect' });
    }
  });

  // Helper functions
  function encryptToken(token: string): string {
    const algorithm = 'aes-256-cbc';
    const rawKey = process.env.ENCRYPTION_KEY || 'fallback-key-for-dev-environment-32chars';
    const key = crypto.createHash('sha256').update(rawKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  function decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-cbc';
    const rawKey = process.env.ENCRYPTION_KEY || 'fallback-key-for-dev-environment-32chars';
    const key = crypto.createHash('sha256').update(rawKey).digest();
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Cron: sync every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled Meta Ads synchronization...');
    try {
      const connections = db.prepare(`SELECT * FROM meta_connections WHERE is_active = 1`).all();
      for (const connection of connections) {
        try {
          const decryptedToken = decryptToken(connection.access_token);
          const tokenExpiresAt = new Date(connection.token_expires_at);
          if (tokenExpiresAt < new Date()) {
            const refreshTokenResponse: AxiosResponse<MetaTokenResponse> = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
              params: { grant_type: 'fb_exchange_token', client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, fb_exchange_token: decryptedToken }
            });
            const newToken = refreshTokenResponse.data.access_token;
            const newExpiry = new Date(Date.now() + (refreshTokenResponse.data.expires_in * 1000));
            db.prepare(`UPDATE meta_connections SET access_token = ?, token_expires_at = ? WHERE id = ?`).run(encryptToken(newToken), newExpiry.toISOString(), connection.id);
          }
          const campaignsResponse: AxiosResponse<MetaCampaignsResponse> = await axios.get(`https://graph.facebook.com/v18.0/act_${connection.ad_account_id}/campaigns`, {
            params: { access_token: decryptedToken, fields: 'id,name,status,objective,budget_remaining,insights{spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions}', date_preset: 'last_30d' }
          });
          const campaignsList = Array.isArray(campaignsResponse.data.data) ? campaignsResponse.data.data : [];
          db.prepare('DELETE FROM meta_campaigns WHERE connection_id = ?').run(connection.id);
          for (const campaign of campaignsList) {
            db.prepare(`INSERT INTO meta_campaigns (id, connection_id, meta_campaign_id, name, status, objective, budget_remaining, raw_data, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
              crypto.randomUUID(), connection.id, campaign.id, campaign.name, campaign.status, campaign.objective,
              parseFloat(campaign.budget_remaining || "0"), JSON.stringify(campaign), new Date().toISOString()
            );
          }
          db.prepare('UPDATE meta_connections SET last_sync_at = ? WHERE id = ?').run(new Date().toISOString(), connection.id);
          console.log(`Synced ${campaignsList.length} campaigns for ${connection.user_email}`);
        } catch (syncError) {
          console.error(`Error syncing for ${connection.user_email}:`, syncError);
        }
      }
    } catch (error) {
      console.error('Scheduled sync error:', error);
    }
  });

  app.use(compression());

  if (process.env.NODE_ENV === "production") {
    // Force HTTPS redirect if on production (assuming load balancer handles SSL)
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        // Option to force https, commenting out to avoid issues if SSL is handled differently
        // res.redirect(`https://${req.header('host')}${req.url}`);
      }
      next();
    });

    app.use(express.static(path.join(process.cwd(), "dist"), {
      maxAge: '1d', // Cache static files for speed
      etag: true
    }));

    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  } else {
    console.log(`Server ready. Now run "vite" in a separate terminal.`);
  }

  // Final Error Handler - Blinda o servidor de vazar informações sensíveis
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({
      error: 'Algo deu errado em nossos servidores.',
      message: process.env.NODE_ENV === 'production' ? 'Um erro interno ocorreu. Nossa equipe foi notificada.' : err.message
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

startServer();