import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from './config';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Loader2,
  BarChart3,
  Rocket,
  Plus,
  History,
  DollarSign,
  Zap,
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { analyzeIdea, generateRoadmap, generateCopy, generateAds, analyzeMetaAds, IdeaContext, Analysis, Roadmap } from './services/geminiService';
import MetaAdsPage from './components/meta-ads/MetaAdsPage';
import ToolsPage from './components/ToolsPage';
import Sidebar from './components/Sidebar';
import { Project } from './types';
import { Button } from './components/ui/Button';
import ReactMarkdown from 'react-markdown';

// --- Components ---

const ProgressBar = ({ progress, label, color = "bg-indigo-600" }: { progress: number, label?: string, color?: string }) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    )}
    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = "text-zinc-900", trend }: any) => (
  <Card className="p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] blur-2xl ${color.replace('text-', 'bg-')}`} />
    <div className="flex justify-between items-start relative z-10">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && (
        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full tracking-wider">
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.25em] mb-2">{label}</p>
      <p className="text-3xl font-light dark:text-white tracking-tighter">{value}</p>
    </div>
  </Card>
);

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: any) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-lg border-t border-zinc-100 dark:border-white/5 md:hidden">
    <div className="flex justify-around items-center h-16">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#2D3250] dark:text-white' : 'text-zinc-400'}`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Início</span>
      </button>
      <button
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-[#2D3250] dark:text-white' : 'text-zinc-400'}`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] font-medium">Projetos</span>
      </button>
      <button
        onClick={() => onTabChange('input')}
        className="flex flex-col items-center -mt-8"
      >
        <div className="w-12 h-12 bg-[#2D3250] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg">
          <Plus className="w-6 h-6 text-white dark:text-zinc-900" />
        </div>
      </button>
      <button
        onClick={() => onTabChange('tools')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'tools' ? 'text-[#2D3250] dark:text-white' : 'text-zinc-400'}`}
      >
        <Zap className="w-5 h-5" />
        <span className="text-[10px] font-medium">Ferramentas</span>
      </button>
      <button
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-[#2D3250] dark:text-white' : 'text-zinc-400'}`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-medium">Ajustes</span>
      </button>
    </div>
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`premium-card ${className}`}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", required = false }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-400">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="premium-input"
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="space-y-2">
    {label && <label className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-400">{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 rounded-2xl border border-zinc-800 bg-[#0A0A0A] text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all appearance-none font-medium"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'login' | 'home' | 'input' | 'context' | 'loading' | 'dashboard' | 'history' | 'tools' | 'settings' | 'meta-ads'>('login');
  const [userEmail, setUserEmail] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [idea, setIdea] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [extraTool, setExtraTool] = useState<'copy' | 'ads' | null>(null);
  const [extraResult, setExtraResult] = useState('');
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [context, setContext] = useState<IdeaContext>({
    timePerDay: '1h',
    experience: 'Iniciante',
    goal: 'Renda Extra',
    situation: 'Zero Absoluto',
    resources: 'Solo'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('Analisando sua ideia...');

  useEffect(() => {
    const savedEmail = localStorage.getItem('ascende_user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setStep('home');
      fetchProjects(savedEmail);
    }

    const savedTheme = localStorage.getItem('ascende_theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(true);
    }

    // Detecta retorno do OAuth do Meta
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      if (savedEmail || localStorage.getItem('ascende_user_email')) {
        setStep('meta-ads');
      }
    }
    if (params.get('meta_error')) {
      console.error('Meta OAuth error:', params.get('meta_error'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('ascende_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('ascende_theme', 'light');
    }
  }, [darkMode]);

  const fetchProjects = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects?email=${email}`);
      if (!res.ok) {
        console.error("Failed to fetch projects:", res.status);
        return;
      }
      const responseText = await res.text();
      if (!responseText) return;
      try {
        const data = JSON.parse(responseText);
        setProjects(data);
        const inExecution = data.find((p: Project) => p.status === 'Em execução');
        if (inExecution && !activeProject) {
          setActiveProject(inExecution);
        }
      } catch (parseError) {
        console.error("Failed to parse projects response:", parseError);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  }, [activeProject]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail) {
      localStorage.setItem('ascende_user_email', userEmail);
      setStep('home');
      fetchProjects(userEmail);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ascende_user_email');
    setUserEmail('');
    setStep('login');
  };

  const handleStartAnalysis = useCallback(async () => {
    setStep('loading');
    try {
      setLoadingMessage('O mentor está analisando o mercado...');
      const analysisResult = await analyzeIdea(idea, context);
      setLoadingMessage('Estruturando seu cronograma de execução detalhado...');
      const roadmapResult = await generateRoadmap(idea, context, analysisResult);
      const newProject = {
        id: Math.random().toString(36).substr(2, 9),
        user_email: userEmail,
        idea,
        context,
        analysis: analysisResult,
        roadmap: roadmapResult,
        completed_tasks: [],
        status: 'Em execução',
        created_at: new Date().toISOString()
      };
      await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      setActiveProject(newProject as Project);
      setStep('dashboard');
      fetchProjects(userEmail);
    } catch (err) {
      console.error(err);
      setStep('input');
      alert("Ocorreu um erro na análise. Tente novamente.");
    }
  }, [idea, context, userEmail, fetchProjects]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (activeProject?.id === id) {
        setActiveProject({ ...activeProject, status: status as any });
      }
      fetchProjects(userEmail);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleGenerateExtra = async (type: 'copy' | 'ads') => {
    if (!activeProject) return;
    setLoadingExtra(true);
    setExtraTool(type);
    try {
      const result = type === 'copy' ? await generateCopy(activeProject) : await generateAds(activeProject);
      setExtraResult(result);
      setStep('tools');
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar conteúdo extra.");
    } finally {
      setLoadingExtra(false);
    }
  };

  const toggleTask = async (dayIndex: number) => {
    if (!activeProject) return;
    const isCompleted = activeProject.completed_tasks.includes(dayIndex);
    const newCompleted = isCompleted
      ? activeProject.completed_tasks.filter(i => i !== dayIndex)
      : [...activeProject.completed_tasks, dayIndex];
    const updated = { ...activeProject, completed_tasks: newCompleted };
    setActiveProject(updated);
    try {
      await fetch(`${API_URL}/api/projects/${activeProject.id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_tasks: newCompleted })
      });
      fetchProjects(userEmail);
    } catch (err) {
      console.error("Failed to update tasks", err);
    }
  };

  const handleStuck = () => {
    alert("O ASCENDE recomenda: Respire. Revise o objetivo da tarefa de hoje. Se a barreira for técnica, procure uma ferramenta no-code ou um tutorial de 15 min. O importante é não parar.");
  };

  const handleExport = () => {
    if (!activeProject) return;
    const daysText = activeProject.roadmap.days
      .map(d => `Dia ${d.day}: ${d.title}\nObjetivo: ${d.objective}\nPassos: ${d.practicalSteps.join(', ')}`)
      .join('\n\n');
    const text = `PROJETO: ${activeProject.idea}

DIAGNÓSTICO: ${activeProject.analysis.diagnosis.verdict}

CRONOGRAMA:
${daysText}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plano-${activeProject.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ---- RENDER FUNCTIONS ----

  const renderLogin = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto pt-20 space-y-12 px-6"
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#2D3250] dark:bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          <Rocket className="w-8 h-8 text-white dark:text-black" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-[0.4em] dark:text-white uppercase">ASCENDE</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-normal">Seu mentor estratégico para renda extra.</p>
        </div>
      </div>
      <Card className="p-8 space-y-6">
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Seu melhor e-mail"
            value={userEmail}
            onChange={setUserEmail}
            placeholder="ex: voce@email.com"
            required
            type="email"
          />
          <Button type="submit" className="w-full py-4 text-lg">
            Entrar no Dashboard <ChevronRight className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest leading-relaxed">
          Ao entrar, você concorda em executar suas ideias com foco total em resultados.
        </p>
      </Card>
    </motion.div>
  );

  const renderHome = () => {
    const activeProjects = projects.filter(p => p.status === 'Em execução');
    const totalTasks = projects.reduce((acc, p) => acc + p.roadmap.days.length, 0);
    const completedTasks = projects.reduce((acc, p) => acc + p.completed_tasks.length, 0);
    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const latestProject = activeProject || projects[0];

    return (
      <motion.div
        key="home"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-6xl mx-auto space-y-8 pb-24 px-4 bg-[#050505]"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-6xl font-black tracking-tighter text-white">Olá, Estrategista</h1>
            <p className="text-zinc-500 text-lg font-medium">Seu progresso rumo à liberdade financeira.</p>
          </div>
          <Button onClick={() => setStep('input')} className="w-full md:w-auto shadow-lg shadow-indigo-500/20">
            Nova Ideia <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Ideias" value={projects.length} icon={Lightbulb} color="text-amber-500" />
          <StatCard label="Ativos" value={activeProjects.length} icon={Rocket} color="text-indigo-500" />
          <StatCard label="Tarefas" value={completedTasks} icon={CheckCircle2} color="text-emerald-500" />
          <StatCard label="Progresso" value={`${Math.round(overallProgress)}%`} icon={TrendingUp} color="text-blue-500" />
        </div>

        {latestProject && (
          <Card className="p-0 overflow-hidden border-none shadow-2xl bg-[#0E0E0E] group">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 p-6 md:p-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                      Projeto em Destaque
                    </span>
                    <div className="h-px flex-grow bg-zinc-100 dark:bg-white/5" />
                  </div>
                  <h2 className="text-4xl md:text-7xl font-extrabold text-white tracking-tighter leading-[0.9] text-balance">
                    {latestProject.idea}
                  </h2>
                </div>
                <div className="ai-content text-lg md:text-xl">
                  <ReactMarkdown>{latestProject.analysis.diagnosis.initialApproach}</ReactMarkdown>
                </div>
                <div className="flex flex-wrap items-center gap-8 pt-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Tempo</p>
                    <div className="flex items-center gap-2 text-sm font-medium dark:text-white">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>{latestProject.context.timePerDay}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Meta</p>
                    <div className="flex items-center gap-2 text-sm font-medium dark:text-white">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>{latestProject.analysis.monetization?.minimumFinancialGoal || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Veredito</p>
                    <div className="flex items-center gap-2 text-sm font-medium dark:text-white">
                      <Target className="w-4 h-4 text-amber-500" />
                      <span>{latestProject.analysis.diagnosis.verdict}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => { setActiveProject(latestProject); setStep('dashboard'); }}
                    className="px-8 py-4 text-base shadow-xl shadow-indigo-500/20"
                  >
                    Continuar Execução <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setActiveProject(latestProject); setStep('dashboard'); }}
                    className="px-8 py-4 text-base"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-5 bg-zinc-900/30 p-6 md:p-10 flex flex-col justify-center border-l border-zinc-800/50">
                <div className="space-y-10">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Progresso Geral</p>
                      <p className="text-2xl font-bold dark:text-white">
                        {Math.round((latestProject.completed_tasks.length / latestProject.roadmap.days.length) * 100)}%
                      </p>
                    </div>
                    <ProgressBar
                      progress={(latestProject.completed_tasks.length / latestProject.roadmap.days.length) * 100}
                      color="bg-indigo-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Próxima Ação Crítica</p>
                    <div className="p-5 bg-white dark:bg-[#1A1A24] rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <p className="text-sm font-bold dark:text-white mb-1">
                        {latestProject.roadmap.days[latestProject.completed_tasks.length]?.title || 'Todas as tarefas concluídas!'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {latestProject.roadmap.days[latestProject.completed_tasks.length]?.objective || 'Você completou o ciclo inicial.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Foco do Momento</p>
                        <p className="text-xs font-medium dark:text-zinc-300">Validar a primeira oferta no mercado.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <DollarSign className="w-4 h-4" /> Dica de Monetização
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Foque no MVP. Não tente construir o império antes de ganhar os primeiros R$ 100.</p>
          </Card>
          <Card className="p-6 space-y-3 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Zap className="w-4 h-4" /> Ação Rápida
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Use a ferramenta de Copy para criar sua primeira oferta hoje mesmo.</p>
          </Card>
          <Card className="p-6 space-y-3 border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <Target className="w-4 h-4" /> Foco do Dia
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Complete pelo menos uma tarefa do seu cronograma para manter o ritmo.</p>
          </Card>
        </div>
      </motion.div>
    );
  };

  const renderInput = () => (
    <motion.div
      key="input"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-2xl mx-auto pt-8 md:pt-12 space-y-6 md:space-y-8 px-4 md:px-6"
    >
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => setStep('home')} className="px-0 hover:bg-transparent -ml-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h2 className="text-4xl font-bold tracking-tight dark:text-white">Qual é a sua ideia?</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Descreva sua ideia de negócio ou renda extra de forma simples.</p>
      </div>
      <Card className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sua Ideia</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ex: Criar uma agência de social media para dentistas locais..."
            className="w-full h-40 px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:border-zinc-600 resize-none"
          />
        </div>
        <Button onClick={() => setStep('context')} disabled={!idea.trim()} className="w-full py-4 text-lg">
          Próximo Passo <ChevronRight className="w-5 h-5" />
        </Button>
      </Card>
    </motion.div>
  );

  const renderContext = () => (
    <motion.div
      key="context"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto pt-8 md:pt-12 space-y-6 md:space-y-8 px-4 md:px-6"
    >
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => setStep('input')} className="px-0 hover:bg-transparent -ml-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h2 className="text-4xl font-bold tracking-tight dark:text-white">Seu Contexto</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Para criar um plano realista, o mentor precisa entender seus recursos.</p>
      </div>
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
        <Select
          label="Tempo disponível por dia"
          value={context.timePerDay}
          onChange={(v: string) => setContext({ ...context, timePerDay: v })}
          options={[
            { label: '30 min', value: '30 min' },
            { label: '1h', value: '1h' },
            { label: '3h', value: '3h' },
            { label: 'Tempo Integral', value: 'Full Time' }
          ]}
        />
        <Select
          label="Nível de Experiência"
          value={context.experience}
          onChange={(v: string) => setContext({ ...context, experience: v })}
          options={[
            { label: 'Iniciante', value: 'Iniciante' },
            { label: 'Intermediário', value: 'Intermediário' },
            { label: 'Avançado', value: 'Avançado' }
          ]}
        />
        <Select
          label="Objetivo Principal"
          value={context.goal}
          onChange={(v: string) => setContext({ ...context, goal: v })}
          options={[
            { label: 'Renda Extra', value: 'Renda Extra' },
            { label: 'Carreira', value: 'Carreira' },
            { label: 'Validação', value: 'Validação' },
            { label: 'Escala', value: 'Escala' }
          ]}
        />
        <Select
          label="Situação Atual"
          value={context.situation}
          onChange={(v: string) => setContext({ ...context, situation: v })}
          options={[
            { label: 'Zero Absoluto', value: 'Zero Absoluto' },
            { label: 'Ideia em Andamento', value: 'Ideia em Andamento' },
            { label: 'Projeto Parado', value: 'Projeto Parado' }
          ]}
        />
        <div className="md:col-span-2">
          <Input
            label="Recursos Disponíveis"
            value={context.resources}
            onChange={(v: string) => setContext({ ...context, resources: v })}
            placeholder="Ex: R$ 500, Laptop, Trabalho sozinho"
          />
        </div>
        <div className="md:col-span-2 pt-4">
          <Button onClick={handleStartAnalysis} className="w-full py-4 text-lg" variant="secondary">
            Gerar Plano de Monetização <Rocket className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  const renderLoading = () => (
    <div className="fixed inset-0 bg-white dark:bg-[#050505] flex flex-col items-center justify-center z-50 p-6 text-center">
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="mb-12 relative"
      >
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full absolute -inset-4 animate-ping" />
        <div className="w-24 h-24 bg-[#2D3250] dark:bg-zinc-100 rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
          <Rocket className="w-12 h-12 text-white dark:text-zinc-900" />
        </div>
      </motion.div>
      <h2 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">{loadingMessage}</h2>
      <div className="max-w-xs space-y-4">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">O mentor está processando trilhões de dados para encontrar o seu caminho mais curto para o lucro.</p>
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
            className="h-full bg-indigo-500"
          />
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!activeProject) return null;
    const progress = (activeProject.completed_tasks.length / activeProject.roadmap.days.length) * 100;

    return (
      <motion.div
        key="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-7xl mx-auto space-y-8 pb-24 px-4 bg-[#050505]"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Button variant="ghost" onClick={() => setStep('home')} className="px-0 hover:bg-transparent -ml-1">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Início
            </Button>
            <h2 className="text-3xl font-bold tracking-tight text-white">{activeProject.idea}</h2>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={handleExport} variant="outline" className="flex-grow md:flex-grow-0">Exportar Plano</Button>
            <Button onClick={handleStuck} variant="accent" className="flex-grow md:flex-grow-0">Estou Travado</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="p-8 space-y-8 bg-[#2D3250]! border-none! text-white! relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-2xl text-white! font-black! tracking-tighter!">Caminho do Dinheiro</h3>
              </div>
              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <p className="text-base font-medium text-white/90 leading-relaxed ai-content">
                    <ReactMarkdown>{activeProject.analysis.monetization?.whereIsTheMoney || 'N/A'}</ReactMarkdown>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-white/90 leading-relaxed ai-content">
                    <ReactMarkdown>{activeProject.analysis.monetization?.firstGainPath || 'N/A'}</ReactMarkdown>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Meta Mínima</p>
                    <p className="text-lg font-bold text-emerald-400">{activeProject.analysis.monetization?.minimumFinancialGoal || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Previsão</p>
                    <p className="text-lg font-bold text-indigo-300">{activeProject.analysis.monetization?.estimatedTimeForFirstGain || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                <Target className="w-5 h-5" /> Status do Projeto
              </div>
              <Select
                value={activeProject.status}
                onChange={(v: string) => updateStatus(activeProject.id, v)}
                options={[
                  { label: 'Em execução', value: 'Em execução' },
                  { label: 'Pausada', value: 'Pausada' },
                  { label: 'Finalizada', value: 'Finalizada' }
                ]}
              />
              <ProgressBar progress={progress} label="Progresso da Execução" color="bg-indigo-500" />
            </Card>

            <Card className="p-6 space-y-6 bg-[#F6B17A] text-zinc-900 border-none shadow-xl">
              <div className="flex items-center gap-2 font-bold">
                <Zap className="w-5 h-5" /> Acelerar Monetização
              </div>
              <p className="text-xs font-medium opacity-80">Gere recursos de copy e anúncios para vender mais rápido.</p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => handleGenerateExtra('copy')} loading={loadingExtra && extraTool === 'copy'} variant="primary" className="text-[10px] py-2 px-3">
                  Copy Vendedora
                </Button>
                <Button onClick={() => handleGenerateExtra('ads')} loading={loadingExtra && extraTool === 'ads'} variant="primary" className="text-[10px] py-2 px-3">
                  Ideias de Ads
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                <BarChart3 className="w-5 h-5" /> Análise de Viabilidade
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Começa do zero?</span>
                  <span className={`font-bold ${activeProject.analysis.viability.canStartFromZero ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {activeProject.analysis.viability.canStartFromZero ? 'Sim' : 'Requer Base'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Complexidade</span>
                  <span className="font-bold dark:text-white">{activeProject.analysis.viability.technicalComplexity}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Curva de Aprendizado</span>
                  <span className="font-bold dark:text-white">{activeProject.analysis.viability.learningCurve}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold dark:text-white">Cronograma de Monetização</h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{activeProject.roadmap.days.length} Dias para o Primeiro Ganho</span>
            </div>
            <div className="space-y-4">
              {activeProject.roadmap.days.map((day, index) => {
                const isCompleted = activeProject.completed_tasks.includes(index);
                return (
                  <Card key={index} className={`relative overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-60 bg-black/40 border-zinc-900' : 'hover:border-indigo-500/30'}`}>
                    <div className="flex gap-4 md:gap-6">
                      <button
                        onClick={() => toggleTask(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold text-xl">{day.day}</span>}
                      </button>
                      <div className="space-y-4 flex-grow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                          <h4 className={`text-xl md:text-2xl font-bold transition-all ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                            {day.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded">
                              {day.moneyFocus}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{day.timeEstimate}</span>
                          </div>
                        </div>
                        {!isCompleted && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm dark:text-zinc-300 ai-content">
                                <ReactMarkdown>{day.objective}</ReactMarkdown>
                              </p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                              <p className="text-xs font-bold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                                <Lightbulb className="w-3 h-3" /> Mentoria Prática
                              </p>
                              <div className="text-sm italic dark:text-zinc-400 leading-relaxed ai-content">
                                <ReactMarkdown>{`"${day.mentorContext}"`}</ReactMarkdown>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Passos Práticos</p>
                                <ul className="space-y-2">
                                  {day.practicalSteps.map((step, idx) => (
                                    <li key={idx} className="text-sm flex gap-2 dark:text-zinc-300">
                                      <span className="text-zinc-400 font-bold">{idx + 1}.</span> {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Ferramentas Sugeridas</p>
                                  <div className="flex flex-wrap gap-2">
                                    {day.recommendedTools.map((tool, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded text-[10px] font-bold">{tool}</span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Decisões Críticas</p>
                                  <ul className="space-y-1">
                                    {day.decisionsToMake.map((decision, idx) => (
                                      <li key={idx} className="text-[11px] text-zinc-500 dark:text-zinc-400 flex gap-2">
                                        <span className="text-indigo-400">•</span> {decision}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={`pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center gap-2 ${isCompleted ? 'text-emerald-500' : 'text-zinc-400'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Resultado Esperado: {day.expectedOutcome}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };



  const renderHistory = () => (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto pt-12 space-y-8 pb-24 px-6 bg-[#050505]"
    >
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => setStep('home')} className="px-0 hover:bg-transparent -ml-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h2 className="text-4xl font-bold tracking-tight dark:text-white">Histórico de Projetos</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Veja todos os projetos que você já iniciou e seu progresso.</p>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <History className="w-8 h-8 text-zinc-300" />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Nenhum projeto ainda</h3>
          <p className="text-zinc-500 mb-6">Comece seu primeiro projeto para aparecer aqui.</p>
          <Button onClick={() => setStep('input')}>Criar Primeiro Projeto</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = (project.completed_tasks.length / project.roadmap.days.length) * 100;
            return (
              <div
                key={project.id}
                className="cursor-pointer"
                onClick={() => { setActiveProject(project); setStep('dashboard'); }}
              >
                <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold dark:text-white line-clamp-2">{project.idea}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${project.status === 'Em execução' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      project.status === 'Pausada' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-3">{project.analysis.diagnosis.initialApproach}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Progresso</span>
                      <span className="font-bold dark:text-white">{Math.round(progress)}%</span>
                    </div>
                    <ProgressBar progress={progress} color="bg-indigo-500" />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span>{project.roadmap.days.length} tarefas</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // ✅ renderSettings INSIDE the App component — has access to userEmail, darkMode, etc.
  const renderSettings = () => (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl mx-auto pt-12 space-y-8 pb-24 px-4 bg-[#050505]"
    >
      <div className="space-y-1">
        <h2 className="text-5xl font-black tracking-tighter text-white">Ajustes</h2>
        <p className="text-zinc-500 text-sm font-medium">Configure sua experiência no ASCENDE.</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">Conta</p>
                <p className="text-xs text-zinc-500">{userEmail}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600">
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">Tema Escuro</p>
                <p className="text-xs text-zinc-500">Ajuste o visual do aplicativo.</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-600' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sobre o ASCENDE</p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            O ASCENDE é seu mentor estratégico para transformar ideias em renda extra real. Focamos em execução, monetização rápida e progresso visível.
          </p>
          <div className="pt-2 flex gap-4">
            <a href="#" className="text-xs text-indigo-500 font-bold">Termos de Uso</a>
            <a href="#" className="text-xs text-indigo-500 font-bold">Privacidade</a>
          </div>
        </Card>
      </div>
    </motion.div>
  );

  // ---- MAIN RETURN ----
  return (
    <div className="min-h-screen bg-[#050505] pt-8 text-[#F0F0F0]">
      {/* Desktop Sidebar - hidden on mobile */}
      {step !== 'login' && step !== 'loading' && (
        <Sidebar
          activeTab={step}
          onTabChange={setStep}
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      )}

      <div className="md:ml-64">
        <AnimatePresence mode="wait">
          {step === 'login' && renderLogin()}
          {step === 'home' && renderHome()}
          {step === 'input' && renderInput()}
          {step === 'context' && renderContext()}
          {step === 'loading' && renderLoading()}
          {step === 'dashboard' && renderDashboard()}
          {step === 'history' && renderHistory()}
          {step === 'tools' && (
            <ToolsPage
              activeProject={activeProject}
              onBack={() => setStep(activeProject ? 'dashboard' : 'home')}
              onGoToMetaAds={() => setStep('meta-ads')}
              onGenerateCopy={() => handleGenerateExtra('copy')}
              onGenerateAds={() => handleGenerateExtra('ads')}
              loadingCopy={loadingExtra && extraTool === 'copy'}
              loadingAds={loadingExtra && extraTool === 'ads'}
              extraResult={extraResult}
              extraTool={extraTool}
            />
          )}
          {step === 'settings' && renderSettings()}
          {step === 'meta-ads' && (
            <motion.div key="meta-ads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MetaAdsPage userEmail={userEmail} onBack={() => setStep('tools')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Only show BottomNav when logged in and on mobile */}
        {step !== 'login' && step !== 'loading' && (
          <BottomNav activeTab={step} onTabChange={setStep} />
        )}
      </div>
    </div>
  );
}


