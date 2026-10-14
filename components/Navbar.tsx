'use client';

import React from 'react';
import {
  IdCard,
  Database,
  RefreshCw,
  Shield,
  UserCheck,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole, GasConnectionConfig } from '@/types/idcard';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  gasConfig: GasConnectionConfig;
  onRefreshData: () => void;
  isLoading: boolean;
  onOpenGasSetup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onChangeRole,
  gasConfig,
  onRefreshData,
  isLoading,
  onOpenGasSetup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <IdCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-['Montserrat']">
                KARTU PESERTA & NAME TAG
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Digital
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Generator Tanda Pengenal Panitia & Peserta Acara
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Spreadsheet ID Pill */}
          <button
            onClick={onOpenGasSetup}
            title="Klik untuk konfigurasi Google Spreadsheet & GAS"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">ID: {gasConfig.spreadsheetId.substring(0, 8)}...</span>
            {gasConfig.isLiveConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Simulasi Local Mode" />
            )}
          </button>

          {/* Sync Button */}
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Muat ulang data dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Sinkron Data</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => onChangeRole('Administrator')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === 'Administrator'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Akses Administrator: Kelola semua fitur, template, & sistem"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </button>
            <button
              onClick={() => onChangeRole('Operator')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === 'Operator'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Akses Operator: Kelola peserta dan cetak ID Card"
            >
              <UserCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Operator</span>
            </button>
            <button
              onClick={() => onChangeRole('Viewer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === 'Viewer'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Akses Viewer: Hanya melihat dan mencetak data"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Viewer</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
