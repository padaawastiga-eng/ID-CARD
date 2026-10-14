'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { DashboardTab } from '@/components/DashboardTab';
import { GeneratorTab } from '@/components/GeneratorTab';
import { TemplateEditorTab } from '@/components/TemplateEditorTab';
import { PesertaTab } from '@/components/PesertaTab';
import { PrintStudioTab } from '@/components/PrintStudioTab';
import { GasSetupTab } from '@/components/GasSetupTab';
import {
  Peserta,
  IDCardTemplate,
  Kegiatan,
  AktivitasLog,
  UserRole,
  GasConnectionConfig,
} from '@/types/idcard';
import {
  INITIAL_PESERTA,
  PRESET_TEMPLATES,
  INITIAL_KEGIATAN,
  INITIAL_LOGS,
  INITIAL_GAS_CONFIG,
} from '@/lib/defaultData';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('Administrator');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Core Data States with lazy initializers
  const [pesertaList, setPesertaList] = useState<Peserta[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('idcard_peserta');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_PESERTA;
  });

  const [templates, setTemplates] = useState<IDCardTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('idcard_templates');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return PRESET_TEMPLATES;
  });

  const [kegiatanList] = useState<Kegiatan[]>(INITIAL_KEGIATAN);
  const [logs, setLogs] = useState<AktivitasLog[]>(INITIAL_LOGS);
  const [gasConfig, setGasConfig] = useState<GasConnectionConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('idcard_gas_config');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_GAS_CONFIG;
  });

  // Transient selection states
  const [selectedPesertaForGenerator, setSelectedPesertaForGenerator] = useState<Peserta | null>(null);
  const [selectedPesertaIdsForPrint, setSelectedPesertaIdsForPrint] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Save changes to localStorage
  const savePesertaToStorage = (updated: Peserta[]) => {
    setPesertaList(updated);
    try {
      localStorage.setItem('idcard_peserta', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const saveTemplatesToStorage = (updated: IDCardTemplate[]) => {
    setTemplates(updated);
    try {
      localStorage.setItem('idcard_templates', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add or update participant
  const handleSavePeserta = (data: Partial<Peserta>) => {
    const now = new Date().toLocaleString('id-ID');
    let updatedList: Peserta[];

    if (data.id) {
      // Edit
      updatedList = pesertaList.map((p) =>
        p.id === data.id
          ? {
              ...p,
              ...data,
              catatan: data.catatan || p.catatan,
            } as Peserta
          : p
      );
      addLog('Perbarui Peserta', `Memperbarui data peserta: ${data.nama}`, currentRole);
      showToast(`Data peserta "${data.nama}" berhasil diperbarui!`);
    } else {
      // Add
      const cleanNo = (data.noIdentitas || '').replace(/[^a-zA-Z0-9]/g, '');
      const uniqueId = `peserta-${cleanNo || pesertaList.length + 1}`;
      const newPeserta: Peserta = {
        id: uniqueId,
        nomor: pesertaList.length + 1,
        nama: data.nama || 'Peserta Baru',
        jabatan: data.jabatan || 'Anggota',
        kegiatan: data.kegiatan || 'Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026',
        instansi: data.instansi || 'Kecamatan Pasirwangi',
        noIdentitas: data.noIdentitas || `PAN-PGRI-2026-${String(pesertaList.length + 1).padStart(3, '0')}`,
        fotoUrl: data.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        templateId: data.templateId || templates[0]?.id || 'tpl-pgri-2026',
        masaBerlaku: data.masaBerlaku || '25 November 2026',
        createdAt: now,
        catatan: data.catatan,
      };
      updatedList = [newPeserta, ...pesertaList];
      addLog('Tambah Peserta', `Menambahkan peserta baru: ${newPeserta.nama}`, currentRole);
      showToast(`Peserta baru "${newPeserta.nama}" berhasil ditambahkan!`);
    }

    savePesertaToStorage(updatedList);
  };

  // Delete participant
  const handleDeletePeserta = (id: string) => {
    const target = pesertaList.find((p) => p.id === id);
    const updated = pesertaList.filter((p) => p.id !== id);
    savePesertaToStorage(updated);
    addLog('Hapus Peserta', `Menghapus peserta: ${target?.nama || id}`, currentRole);
    showToast(`Peserta berhasil dihapus.`, 'info');
  };

  // Bulk Delete
  const handleBulkDeletePeserta = (ids: string[]) => {
    const updated = pesertaList.filter((p) => !ids.includes(p.id));
    savePesertaToStorage(updated);
    addLog('Hapus Massal', `Menghapus ${ids.length} peserta sekaligus`, currentRole);
    showToast(`${ids.length} peserta berhasil dihapus.`, 'info');
  };

  // Bulk Print from Peserta Tab
  const handleBulkPrint = (selected: Peserta[]) => {
    setSelectedPesertaIdsForPrint(selected.map((s) => s.id));
    setActiveTab('print');
    showToast(`Membuka Studio Cetak untuk ${selected.length} peserta terpilih!`, 'info');
  };

  // Preview Card action
  const handlePreviewPeserta = (peserta: Peserta) => {
    setSelectedPesertaForGenerator(peserta);
    setActiveTab('generator');
  };

  // Save template
  const handleSaveTemplate = (updatedTemplate: IDCardTemplate) => {
    const existingIdx = templates.findIndex((t) => t.id === updatedTemplate.id);
    let newTemplates: IDCardTemplate[];

    if (existingIdx >= 0) {
      newTemplates = [...templates];
      newTemplates[existingIdx] = updatedTemplate;
    } else {
      newTemplates = [...templates, updatedTemplate];
    }

    saveTemplatesToStorage(newTemplates);
    addLog('Modifikasi Template', `Menyimpan perubahan template "${updatedTemplate.name}"`, currentRole);
    showToast(`Template "${updatedTemplate.name}" berhasil disimpan!`);
  };

  // Duplicate template
  const handleDuplicateTemplate = (newTemplate: IDCardTemplate) => {
    const newTemplates = [...templates, newTemplate];
    saveTemplatesToStorage(newTemplates);
    addLog('Duplikasi Template', `Menduplikasi template "${newTemplate.name}"`, currentRole);
    showToast(`Template "${newTemplate.name}" berhasil dibuat!`);
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      alert('Tidak dapat menghapus template terakhir!');
      return;
    }
    const target = templates.find((t) => t.id === templateId);
    const updated = templates.filter((t) => t.id !== templateId);
    saveTemplatesToStorage(updated);
    addLog('Hapus Template', `Menghapus template "${target?.name || templateId}"`, currentRole);
    showToast(`Template berhasil dihapus.`, 'info');
  };

  // Add system audit log
  const addLog = (action: string, details: string, user: string) => {
    const logId = `log-${logs.length + 1}`;
    const newLog: AktivitasLog = {
      id: logId,
      timestamp: new Date().toLocaleString('id-ID'),
      action,
      user,
      details,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  };

  // Refresh data simulation / sync
  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Data berhasil disinkronkan dengan Google Spreadsheet!', 'success');
      addLog('Sinkron Data', 'Menyinkronkan data dari Spreadsheet ID 1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU', currentRole);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onChangeRole={(role) => {
          setCurrentRole(role);
          showToast(`Hak akses berganti ke: ${role}`, 'info');
        }}
        gasConfig={gasConfig}
        onRefreshData={handleRefreshData}
        isLoading={isLoading}
        onOpenGasSetup={() => setActiveTab('gas_setup')}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl bg-slate-900 border border-slate-700 text-white flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentRole={currentRole}
          pesertaCount={pesertaList.length}
          templateCount={templates.length}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/90">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                pesertaList={pesertaList}
                templates={templates}
                kegiatanList={kegiatanList}
                logs={logs}
                onNavigate={setActiveTab}
                currentRole={currentRole}
                onSelectPesertaForPreview={handlePreviewPeserta}
              />
            )}

            {activeTab === 'generator' && (
              <GeneratorTab
                templates={templates}
                pesertaList={pesertaList}
                onSavePeserta={handleSavePeserta}
                currentRole={currentRole}
                initialPeserta={selectedPesertaForGenerator}
              />
            )}

            {activeTab === 'editor' && (
              <TemplateEditorTab
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                onDuplicateTemplate={handleDuplicateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                samplePeserta={pesertaList[0] || INITIAL_PESERTA[0]}
              />
            )}

            {activeTab === 'peserta' && (
              <PesertaTab
                pesertaList={pesertaList}
                templates={templates}
                onSavePeserta={handleSavePeserta}
                onDeletePeserta={handleDeletePeserta}
                onBulkDelete={handleBulkDeletePeserta}
                onBulkPrint={handleBulkPrint}
                onPreviewCard={handlePreviewPeserta}
                currentRole={currentRole}
              />
            )}

            {activeTab === 'print' && (
              <PrintStudioTab
                pesertaList={pesertaList}
                templates={templates}
                selectedPesertaIds={selectedPesertaIdsForPrint}
              />
            )}

            {activeTab === 'gas_setup' && (
              <GasSetupTab
                gasConfig={gasConfig}
                onUpdateGasConfig={(cfg) => {
                  setGasConfig(cfg);
                  try {
                    localStorage.setItem('idcard_gas_config', JSON.stringify(cfg));
                  } catch (e) {
                    console.warn(e);
                  }
                  showToast('Konfigurasi Google Apps Script berhasil diperbarui!');
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
