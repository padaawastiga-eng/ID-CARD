'use client';

import React, { useState, useRef } from 'react';
import {
  Printer,
  FileText,
  Sliders,
  Scissors,
  CheckSquare,
  Square,
  Sparkles,
  Maximize2,
  Download,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Peserta, IDCardTemplate, PrintSettings } from '@/types/idcard';
import { CardCanvas } from '@/components/CardCanvas';
import { exportMultipleCardsPdf } from '@/lib/exportUtils';

interface PrintStudioTabProps {
  pesertaList: Peserta[];
  templates: IDCardTemplate[];
  selectedPesertaIds?: string[];
}

export const PrintStudioTab: React.FC<PrintStudioTabProps> = ({
  pesertaList,
  templates,
  selectedPesertaIds = [],
}) => {
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    cardsPerRow: 2,
    cardsPerColumn: 4,
    marginMm: 8,
    gapMm: 4,
    showCutMarks: true,
    scalePercent: 100,
  });

  const [activeIds, setActiveIds] = useState<string[]>(
    selectedPesertaIds.length > 0 ? selectedPesertaIds : pesertaList.map((p) => p.id)
  );

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printSheetRef = useRef<HTMLDivElement | null>(null);

  // List of participants to print
  const printablePeserta = pesertaList.filter((p) => activeIds.includes(p.id));

  // Toggle selection
  const handleToggleId = (id: string) => {
    if (activeIds.includes(id)) {
      setActiveIds(activeIds.filter((i) => i !== id));
    } else {
      setActiveIds([...activeIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (activeIds.length === pesertaList.length) {
      setActiveIds([]);
    } else {
      setActiveIds(pesertaList.map((p) => p.id));
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Bulk PDF Export
  const handleExportPdf = async () => {
    if (!printSheetRef.current) return;
    try {
      setIsExportingPdf(true);
      // Collect individual card elements
      const cardEls = Array.from(
        printSheetRef.current.querySelectorAll('.single-print-card-wrapper')
      ) as HTMLElement[];

      if (cardEls.length === 0) {
        alert('Tidak ada kartu yang dipilih untuk diekspor!');
        return;
      }

      await exportMultipleCardsPdf(
        cardEls,
        `Cetak_ID_Card_${printSettings.paperSize}_${new Date().toISOString().slice(0, 10)}.pdf`,
        printSettings.paperSize === 'F4' ? 'F4' : 'A4'
      );
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor PDF massal.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-['Montserrat']">
              Studio Cetak & Tata Letak Kertas
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengaturan presisi untuk cetak 1 kartu per lembar, A4 (8/10 kartu), atau F4 dengan garis bantu potong agar hasil potong rapi dan simetris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || printablePeserta.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Ekspor PDF Massal'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={printablePeserta.length === 0}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Browser (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Settings (4 cols), Right Paper Simulation (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Settings Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 space-y-5 text-xs no-print">
          <div className="border-b border-slate-200 dark:border-slate-700/60 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm font-['Montserrat'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span>Format Kertas & Tata Letak</span>
            </h2>
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-400 font-bold px-2 py-0.5 rounded">
              {printablePeserta.length} Kartu
            </span>
          </div>

          {/* 1. Ukuran Kertas */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              1. Format Kertas Cetak
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'A4', label: 'A4 (210×297)', sub: 'Standar Kantor' },
                { id: 'F4', label: 'F4 / Folio', sub: '215×330 mm' },
                { id: 'SINGLE', label: '1 Kartu', sub: 'Single CR-80' },
              ].map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() =>
                    setPrintSettings({
                      ...printSettings,
                      paperSize: paper.id as any,
                      cardsPerRow: paper.id === 'SINGLE' ? 1 : 2,
                    })
                  }
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-medium text-center ${
                    printSettings.paperSize === paper.id
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="font-bold">{paper.label}</span>
                  <span className="text-[9px] opacity-75">{paper.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Kartu Per Baris & Kolom (jika A4 / F4) */}
          {printSettings.paperSize !== 'SINGLE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kartu per Baris
                </label>
                <select
                  value={printSettings.cardsPerRow}
                  onChange={(e) =>
                    setPrintSettings({ ...printSettings, cardsPerRow: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={2}>2 Kartu / Baris (Rekomendasi)</option>
                  <option value={3}>3 Kartu / Baris</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jarak Antarkartu (Gap)
                </label>
                <select
                  value={printSettings.gapMm}
                  onChange={(e) =>
                    setPrintSettings({ ...printSettings, gapMm: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={2}>2 mm (Rapat)</option>
                  <option value={4}>4 mm (Standar)</option>
                  <option value={6}>6 mm (Lebar)</option>
                  <option value={8}>8 mm (Sangat Lebar)</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. Margin Kertas & Garis Bantu */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Margin Kertas: {printSettings.marginMm} mm
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                value={printSettings.marginMm}
                onChange={(e) =>
                  setPrintSettings({ ...printSettings, marginMm: Number(e.target.value) })
                }
                className="w-full accent-sky-500"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={printSettings.showCutMarks}
                onChange={(e) =>
                  setPrintSettings({ ...printSettings, showCutMarks: e.target.checked })
                }
                className="rounded text-sky-500 focus:ring-sky-400"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Tampilkan Garis Bantu Potong (Crop Marks)
                </span>
                <span className="text-[10px] text-slate-400">
                  Garis panduan untuk pemotong kertas agar ukuran presisi 54 × 86 mm.
                </span>
              </div>
            </label>
          </div>

          {/* 4. Daftar Peserta yang Dicetak */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Pilih Peserta untuk Dicetak ({activeIds.length}/{pesertaList.length})
              </span>
              <button
                onClick={handleSelectAll}
                className="text-[11px] text-sky-500 hover:underline font-semibold"
              >
                {activeIds.length === pesertaList.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/40">
              {pesertaList.map((p) => {
                const isChecked = activeIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    onClick={() => handleToggleId(p.id)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-[11px]"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.nama}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto truncate">{p.jabatan}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Paper Preview Simulation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Simulasi Kertas Cetak ({printSettings.paperSize})
              </span>
              <span className="text-[11px] text-slate-400">
                Skala Fisik 100% (CR-80: 54 × 86 mm)
              </span>
            </div>
            <button
              onClick={handlePrint}
              className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau Cetak</span>
            </button>
          </div>

          {/* Paper Sheet Simulator */}
          <div
            id="print-sheet-area"
            ref={printSheetRef}
            style={{
              padding: `${printSettings.marginMm}mm`,
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              minHeight: printSettings.paperSize === 'SINGLE' ? 'auto' : '297mm',
              width: printSettings.paperSize === 'SINGLE' ? 'auto' : '210mm',
              color: '#000000',
            }}
            className="rounded-lg border border-slate-300 mx-auto overflow-hidden transition-all duration-300"
          >
            {/* Grid of ID Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  printSettings.paperSize === 'SINGLE'
                    ? '1fr'
                    : `repeat(${printSettings.cardsPerRow}, minmax(0, 1fr))`,
                gap: `${printSettings.gapMm}mm`,
                justifyItems: 'center',
                alignItems: 'center',
              }}
            >
              {printablePeserta.length === 0 ? (
                <div className="py-20 text-center text-slate-400 w-full col-span-2">
                  <p className="font-semibold text-sm">Tidak ada peserta yang dipilih untuk dicetak.</p>
                  <p className="text-xs mt-1">Pilih peserta dari panel samping kiri.</p>
                </div>
              ) : (
                printablePeserta.map((peserta) => {
                  const tpl = templates.find((t) => t.id === peserta.templateId) || templates[0];
                  return (
                    <div
                      key={peserta.id}
                      className="single-print-card-wrapper relative"
                      style={{
                        padding: printSettings.showCutMarks ? '3mm' : '0mm',
                      }}
                    >
                      {/* Cutting Guide Marks (Crop Marks) */}
                      {printSettings.showCutMarks && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Top-left corner mark */}
                          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-slate-400" />
                          {/* Top-right corner mark */}
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-slate-400" />
                          {/* Bottom-left corner mark */}
                          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-slate-400" />
                          {/* Bottom-right corner mark */}
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-slate-400" />
                        </div>
                      )}

                      {/* Actual Physical Size ID Card */}
                      <CardCanvas
                        template={tpl}
                        peserta={peserta}
                        scale={1.0} // 1.0 = true physical scale (54 x 86 mm)
                        isEditable={false}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-[11px] text-slate-500 no-print">
            <p>
              💡 <em>
                Tips Cetak: Di jendela Print browser, pastikan <strong>Margins: None / Minimum</strong> dan
                centang <strong>Background graphics (Grafik latar belakang)</strong> agar warna dan gradasi tercetak tajam.
              </em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
