'use client';

import React, { useState } from 'react';
import {
  IdCard,
  Palette,
  Users,
  Calendar,
  Sparkles,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Eye,
  CheckCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { Peserta, IDCardTemplate, Kegiatan, AktivitasLog, UserRole } from '@/types/idcard';
import { CardCanvas } from '@/components/CardCanvas';
import { ActiveTab } from '@/components/Sidebar';

interface DashboardTabProps {
  pesertaList: Peserta[];
  templates: IDCardTemplate[];
  kegiatanList: Kegiatan[];
  logs: AktivitasLog[];
  onNavigate: (tab: ActiveTab) => void;
  currentRole: UserRole;
  onSelectPesertaForPreview: (peserta: Peserta) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  pesertaList,
  templates,
  kegiatanList,
  logs,
  onNavigate,
  currentRole,
  onSelectPesertaForPreview,
}) => {
  const [previewPeserta, setPreviewPeserta] = useState<Peserta | null>(pesertaList[0] || null);

  const activeTemplate =
    templates.find((t) => t.id === (previewPeserta?.templateId || 'tpl-pgri-2026')) || templates[0];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white border border-slate-700/60 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem ID Card Digital Multifungsi v2.1</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-['Montserrat'] text-white">
            Kelola, Desain & Cetak ID Card Secara Mandiri
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300 leading-relaxed">
            Aplikasi terintegrasi Google Apps Script dan Google Spreadsheet. Anda dapat mengganti
            desain template, foto, nama, jabatan, keterangan kegiatan, dan instansi secara langsung
            tanpa menyentuh kode program.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {currentRole !== 'Viewer' && (
              <button
                onClick={() => onNavigate('generator')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buat ID Card Baru</span>
              </button>
            )}

            {currentRole === 'Administrator' && (
              <button
                onClick={() => onNavigate('editor')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
              >
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Kelola Template</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('peserta')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Kelola Data Peserta</span>
            </button>

            <button
              onClick={() => onNavigate('print')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Cetak & Unduh ID Card</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ID Card Dibuat */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ID Card Dibuat
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {pesertaList.length}
            </h3>
            <span className="text-[11px] text-emerald-500 font-medium inline-flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Siap Cetak
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <IdCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Template Tersedia */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Template Tersedia
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {templates.length}
            </h3>
            <span className="text-[11px] text-purple-400 font-medium inline-flex items-center gap-1 mt-1">
              <Palette className="w-3 h-3" /> Potret & Lanskap
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Palette className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Data Peserta */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Data Peserta
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {pesertaList.length}
            </h3>
            <span className="text-[11px] text-sky-400 font-medium inline-flex items-center gap-1 mt-1">
              <FileSpreadsheet className="w-3 h-3" /> Database Aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Jumlah Kegiatan */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jumlah Kegiatan
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {kegiatanList.length}
            </h3>
            <span className="text-[11px] text-blue-400 font-medium inline-flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" /> Terdaftar
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Data Peserta Terbaru & Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Peserta Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-['Montserrat']">
                Daftar Peserta & Panitia Terbaru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klik salah satu peserta untuk pratinjau ID Card langsung
              </p>
            </div>
            <button
              onClick={() => onNavigate('peserta')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Foto & Nama</th>
                  <th className="px-4 py-3">Jabatan</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Instansi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {pesertaList.slice(0, 5).map((p) => {
                  const isSelected = previewPeserta?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setPreviewPeserta(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-500/10 dark:bg-amber-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.fotoUrl}
                            alt={p.nama}
                            className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {p.nama}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {p.noIdentitas}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {p.jabatan}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-600 dark:text-slate-300">
                        {p.instansi}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPeserta(p);
                            onSelectPesertaForPreview(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500"
                          title="Lihat Pratinjau ID Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center justify-between">
            <span>Menampilkan 5 dari {pesertaList.length} peserta</span>
            <button
              onClick={() => onNavigate('peserta')}
              className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              + Tambah Peserta Baru
            </button>
          </div>
        </div>

        {/* Right Column: Live Card Canvas Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-['Montserrat']">
                Pratinjau ID Card Terpilih
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Template: <strong className="text-amber-500">{activeTemplate.name}</strong>
              </p>
            </div>
            <button
              onClick={() => onNavigate('generator')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buka Generator</span>
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="w-full flex-1 flex items-center justify-center py-6 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            {previewPeserta && (
              <CardCanvas
                template={activeTemplate}
                peserta={previewPeserta}
                scale={1.35}
                isEditable={false}
              />
            )}
          </div>

          {/* Quick Download / Print options for this active card */}
          <div className="w-full mt-4 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium truncate">
              {previewPeserta ? previewPeserta.nama : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('generator')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File</span>
              </button>
              <button
                onClick={() => onNavigate('print')}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Activity Log & Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Log (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm font-['Montserrat'] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Riwayat Aktivitas Pembuatan ID Card</span>
            </h3>
            <span className="text-[11px] text-slate-500">Sheet: LOG_AKTIVITAS</span>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/40 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Oleh: {log.user}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Status Info Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>Google Spreadsheet Connected</span>
            </div>
            <h3 className="font-bold text-base text-white font-['Montserrat']">
              Database Spreadsheet
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Spreadsheet ID:
              <br />
              <span className="font-mono text-amber-400 text-[11px] break-all">
                1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU
              </span>
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sheet Tersedia</span>
                <span className="font-semibold text-emerald-400">5 Sheet Terverifikasi</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Penyimpanan Foto</span>
                <span className="font-semibold text-sky-400">Google Drive Storage</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Format Cetak</span>
                <span className="font-semibold text-amber-400">A4, F4, Single CR80</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('gas_setup')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition text-center"
          >
            Lihat Kode Backend Google Apps Script
          </button>
        </div>
      </div>
    </div>
  );
};
