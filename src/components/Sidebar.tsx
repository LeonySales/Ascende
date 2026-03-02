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
    <div className="hidden md:block w-64 bg-[#0A0A0A] border-r border-zinc-900 h-screen fixed left-0 top-0 z-40">
      <div className="p-8 border-b border-zinc-900">
        <h1 className="text-2xl font-black tracking-tighter text-white">ASCENDE</h1>
        <p className="text-[10px] text-zinc-500 mt-2 truncate tracking-widest uppercase font-bold">{userEmail}</p>
      </div>

      <nav className="p-4 space-y-2 mt-4">
        <button
          onClick={() => onTabChange('home')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'home'
              ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.05)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Início</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'history'
              ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.05)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <History className="w-5 h-5" />
          <span className="font-medium">Projetos</span>
        </button>

        <button
          onClick={() => onTabChange('input')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'input'
              ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.05)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nova Ideia</span>
        </button>

        <button
          onClick={() => onTabChange('tools')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'tools'
              ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.05)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Zap className="w-5 h-5" />
          <span className="font-medium">Ferramentas</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 ${activeTab === 'settings'
              ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.05)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Ajustes</span>
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-900 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{userEmail.split('@')[0]}</p>
            <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest">{userEmail.split('@')[1]}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}