'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Palette,
  Users,
  Printer,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileDown
} from 'lucide-react';
import { UserRole } from '@/types/idcard';

export type ActiveTab = 'dashboard' | 'generator' | 'editor' | 'peserta' | 'print' | 'gas_setup';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentRole: UserRole;
  pesertaCount: number;
  templateCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  currentRole,
  pesertaCount,
  templateCount,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-sky-400',
      allowedRoles: ['Administrator', 'Operator', 'Viewer'],
    },
    {
      id: 'generator' as ActiveTab,
      label: 'Generator ID Card',
      icon: Sparkles,
      badge: 'Instan',
      color: 'text-amber-400',
      allowedRoles: ['Administrator', 'Operator'],
    },
    {
      id: 'editor' as ActiveTab,
      label: 'Editor Template',
      icon: Palette,
      badge: templateCount > 0 ? `${templateCount}` : null,
      color: 'text-purple-400',
      allowedRoles: ['Administrator'],
    },
    {
      id: 'peserta' as ActiveTab,
      label: 'Data Peserta',
      icon: Users,
      badge: pesertaCount > 0 ? `${pesertaCount}` : null,
      color: 'text-emerald-400',
      allowedRoles: ['Administrator', 'Operator', 'Viewer'],
    },
    {
      id: 'print' as ActiveTab,
      label: 'Studio Cetak & Unduh',
      icon: Printer,
      badge: 'A4/F4',
      color: 'text-rose-400',
      allowedRoles: ['Administrator', 'Operator', 'Viewer'],
    },
    {
      id: 'gas_setup' as ActiveTab,
      label: 'Backend GAS & Database',
      icon: FileCode2,
      badge: 'Code.gs',
      color: 'text-blue-400',
      allowedRoles: ['Administrator', 'Operator', 'Viewer'],
    },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Toggle */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Menu Aplikasi
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(currentRole);
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => isAllowed && onSelectTab(item.id)}
              disabled={!isAllowed}
              title={!isAllowed ? `Memerlukan akses ${item.allowedRoles.join('/')}` : item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                  : isAllowed
                  ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-400' : item.color}`} />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action in Footer */}
      {!isCollapsed && currentRole !== 'Viewer' && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={() => onSelectTab('generator')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/15 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat ID Card Cepat</span>
          </button>
        </div>
      )}
    </aside>
  );
};
