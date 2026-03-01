import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Plus, 
  Zap, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { Button } from './ui/Button';

type StepType = 'login' | 'home' | 'input' | 'context' | 'loading' | 'dashboard' | 'history' | 'tools' | 'settings' | 'meta-ads';

interface SidebarProps {
  activeTab: StepType;
  onTabChange: (tab: StepType) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, userEmail, onLogout }: SidebarProps) {
  return (
    <div className="hidden md:block w-64 bg-white dark:bg-[#0A0A0A] border-r border-zinc-200 dark:border-zinc-800 h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight dark:text-white">ASCENDE</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{userEmail}</p>
      </div>
      
      <nav className="p-4 space-y-2">
        <button
          onClick={() => onTabChange('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
            activeTab === 'home'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </button>
        
        <button
          onClick={() => onTabChange('history')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
            activeTab === 'history'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Projetos</span>
        </button>
        
        <button
          onClick={() => onTabChange('input')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
            activeTab === 'input'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>Nova Ideia</span>
        </button>
        
        <button
          onClick={() => onTabChange('tools')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
            activeTab === 'tools'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>Ferramentas</span>
        </button>
        
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
            activeTab === 'settings'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Ajustes</span>
        </button>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium dark:text-white truncate">{userEmail.split('@')[0]}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userEmail}</p>
          </div>
          <Button variant="ghost" onClick={onLogout} className="p-2 text-zinc-500 hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}