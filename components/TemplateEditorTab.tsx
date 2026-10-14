'use client';

import React, { useState } from 'react';
import {
  Palette,
  Save,
  Copy,
  Trash2,
  Upload,
  Move,
  Type,
  Image as ImageIcon,
  QrCode,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  CheckCircle2,
  Sliders,
  Layers,
  Settings2
} from 'lucide-react';
import { IDCardTemplate, Orientation, PhotoShape, TextAlign, Peserta } from '@/types/idcard';
import { CardCanvas } from '@/components/CardCanvas';

interface TemplateEditorTabProps {
  templates: IDCardTemplate[];
  onSaveTemplate: (template: IDCardTemplate) => void;
  onDuplicateTemplate: (template: IDCardTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  samplePeserta: Peserta;
}

export const TemplateEditorTab: React.FC<TemplateEditorTabProps> = ({
  templates,
  onSaveTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  samplePeserta,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tpl-pgri-2026');
  const [currentTemplate, setCurrentTemplate] = useState<IDCardTemplate>(
    templates.find((t) => t.id === selectedTemplateId) || templates[0]
  );
  const [activeSubTab, setActiveSubTab] = useState<'layout' | 'photo' | 'typography' | 'logos' | 'colors'>('layout');
  const [activeElementKey, setActiveElementKey] = useState<string | null>('nameElement');
  const [zoomScale, setZoomScale] = useState<number>(1.4);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync when template selector changes
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setCurrentTemplate(JSON.parse(JSON.stringify(found)));
    }
  };

  // Drag-and-drop move handler
  const handleElementMove = (elementKey: string, x: number, y: number) => {
    setCurrentTemplate((prev) => {
      const copy = { ...prev };
      if (elementKey === 'photo') {
        copy.photo = { ...copy.photo, x, y };
      } else if (elementKey === 'header') {
        copy.header = { ...copy.header, x, y };
      } else if (elementKey === 'nameElement') {
        copy.nameElement = { ...copy.nameElement, x, y };
      } else if (elementKey === 'roleElement') {
        copy.roleElement = { ...copy.roleElement, x, y };
      } else if (elementKey === 'eventElement') {
        copy.eventElement = { ...copy.eventElement, x, y };
      } else if (elementKey === 'institutionElement') {
        copy.institutionElement = { ...copy.institutionElement, x, y };
      } else if (elementKey === 'idNumberElement') {
        copy.idNumberElement = { ...copy.idNumberElement, x, y };
      } else if (elementKey === 'expiryElement') {
        copy.expiryElement = { ...copy.expiryElement, x, y };
      } else if (elementKey === 'logo1') {
        copy.logo1 = { ...copy.logo1, x, y };
      } else if (elementKey === 'logo2') {
        copy.logo2 = { ...copy.logo2, x, y };
      } else if (elementKey === 'qrCode') {
        copy.qrCode = { ...copy.qrCode, x, y };
      } else if (elementKey === 'signature') {
        copy.signature = { ...copy.signature, x, y };
      }
      return copy;
    });
  };

  // Upload background image
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentTemplate((prev) => ({
          ...prev,
          backgroundImage: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Logo 1
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, logoKey: 'logo1' | 'logo2') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentTemplate((prev) => ({
          ...prev,
          [logoKey]: {
            ...prev[logoKey],
            url: result,
            visible: true,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveTemplate(currentTemplate);
    setSaveSuccessMsg(`Template "${currentTemplate.name}" berhasil disimpan!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDuplicate = () => {
    const newTpl: IDCardTemplate = {
      ...JSON.parse(JSON.stringify(currentTemplate)),
      id: `tpl-${Date.now()}`,
      name: `${currentTemplate.name} (Salinan)`,
    };
    onDuplicateTemplate(newTpl);
    setSelectedTemplateId(newTpl.id);
    setCurrentTemplate(newTpl);
    setSaveSuccessMsg(`Template berhasil diduplikasi menjadi "${newTpl.name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Template Selection Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-['Montserrat']">
              Editor Template ID Card Visual (WYSIWYG)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Geser (drag-and-drop) elemen langsung pada kanvas, atur font, warna, ukuran, dan logo secara instan.
          </p>
        </div>

        {/* Template Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.orientation === 'portrait' ? 'Potret' : 'Lanskap'})
              </option>
            ))}
          </select>

          <button
            onClick={handleDuplicate}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Duplikasi Template Ini"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplikat</span>
          </button>

          {templates.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Yakin ingin menghapus template "${currentTemplate.name}"?`)) {
                  onDeleteTemplate(currentTemplate.id);
                  const remaining = templates.filter((t) => t.id !== currentTemplate.id);
                  if (remaining.length > 0) {
                    handleSelectTemplate(remaining[0].id);
                  }
                }
              }}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs transition"
              title="Hapus Template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Template</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Editor Main Grid: Left Controls (5 cols), Right Live Canvas (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controls Tabs (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
          {/* Subtabs Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 p-1 gap-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('layout')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeSubTab === 'layout'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ukuran & Dasar</span>
            </button>
            <button
              onClick={() => setActiveSubTab('typography')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeSubTab === 'typography'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Teks & Font</span>
            </button>
            <button
              onClick={() => setActiveSubTab('photo')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeSubTab === 'photo'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>
            <button
              onClick={() => setActiveSubTab('colors')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeSubTab === 'colors'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Warna / Tema</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logos')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeSubTab === 'logos'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Logo & QR</span>
            </button>
          </div>

          {/* Subtab Content Area */}
          <div className="p-5 space-y-4 max-h-[620px] overflow-y-auto text-xs">
            {/* SUBTAB 1: UKURAN & DASAR */}
            {activeSubTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Template
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.name}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Orientasi Kartu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          orientation: 'portrait',
                          widthMm: 54,
                          heightMm: 86,
                        })
                      }
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-medium ${
                        currentTemplate.orientation === 'portrait'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="w-6 h-9 rounded border-2 border-current" />
                      <span>Potret (54 × 86 mm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          orientation: 'landscape',
                          widthMm: 86,
                          heightMm: 54,
                        })
                      }
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-medium ${
                        currentTemplate.orientation === 'landscape'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="w-9 h-6 rounded border-2 border-current" />
                      <span>Lanskap (86 × 54 mm)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Lebar Fisik (mm)
                    </label>
                    <input
                      type="number"
                      value={currentTemplate.widthMm}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, widthMm: Number(e.target.value) || 54 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tinggi Fisik (mm)
                    </label>
                    <input
                      type="number"
                      value={currentTemplate.heightMm}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, heightMm: Number(e.target.value) || 86 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Radius Sudut (px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={currentTemplate.borderRadius}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, borderRadius: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-400">{currentTemplate.borderRadius}px</span>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tebal Border Kartu (px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={currentTemplate.borderWidth}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, borderWidth: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-400">{currentTemplate.borderWidth}px</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Warna Border Kartu
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTemplate.borderColor}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, borderColor: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTemplate.borderColor}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, borderColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Garis Aksen Atas (Ribbon Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTemplate.accentBarColor || '#eab308'}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, accentBarColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTemplate.accentBarColor || '#eab308'}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, accentBarColor: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: TYPOGRAPHY & TEKS */}
            {activeSubTab === 'typography' && (
              <div className="space-y-4">
                {/* Pilih Elemen Teks yang sedang diedit */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pilih Elemen Teks untuk Disesuaikan
                  </label>
                  <select
                    value={activeElementKey || 'nameElement'}
                    onChange={(e) => setActiveElementKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="header">Judul / Header (ID CARD PANITIA)</option>
                    <option value="nameElement">Nama Lengkap Peserta</option>
                    <option value="roleElement">Jabatan / Peran (Ketua Panitia)</option>
                    <option value="eventElement">Keterangan Kegiatan</option>
                    <option value="institutionElement">Instansi / Sekolah</option>
                    <option value="idNumberElement">Nomor Identitas</option>
                    <option value="expiryElement">Masa Berlaku</option>
                  </select>
                </div>

                {/* Header-specific text field */}
                {activeElementKey === 'header' && (
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Teks Header
                    </label>
                    <input
                      type="text"
                      value={currentTemplate.header.text}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          header: { ...currentTemplate.header, text: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentTemplate.header.isBadge}
                          onChange={(e) =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              header: { ...currentTemplate.header, isBadge: e.target.checked },
                            })
                          }
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span>Tampilkan sebagai Badge / Pita</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Role badge options */}
                {activeElementKey === 'roleElement' && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentTemplate.roleElement.isBadge}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            roleElement: { ...currentTemplate.roleElement, isBadge: e.target.checked },
                          })
                        }
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="font-semibold">Beri Latar Belakang Badge pada Jabatan</span>
                    </label>
                    {currentTemplate.roleElement.isBadge && (
                      <div className="flex items-center gap-2 pt-1">
                        <span>Warna Badge:</span>
                        <input
                          type="color"
                          value={currentTemplate.roleElement.badgeBg || '#fbbf24'}
                          onChange={(e) =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              roleElement: { ...currentTemplate.roleElement, badgeBg: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Universal Text Property Controls based on activeElementKey */}
                {(() => {
                  const elKey = (activeElementKey as keyof IDCardTemplate) || 'nameElement';
                  const el = currentTemplate[elKey] as any;
                  if (!el) return null;

                  return (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      {/* Font Family */}
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Jenis Huruf (Font Family)
                        </label>
                        <select
                          value={el.fontFamily || 'Montserrat'}
                          onChange={(e) =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              [elKey]: { ...el, fontFamily: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="Montserrat">Montserrat (Modern Tebal)</option>
                          <option value="Inter">Inter (Elegan & Bersih)</option>
                          <option value="Roboto">Roboto (Standar)</option>
                          <option value="Poppins">Poppins (Geometrik Halus)</option>
                          <option value="Playfair Display">Playfair Display (Serif Klasik)</option>
                          <option value="Oswald">Oswald (Kondensasi Ringkas)</option>
                        </select>
                      </div>

                      {/* Font Size & Weight */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Ukuran Font: {el.fontSize}px
                          </label>
                          <input
                            type="range"
                            min="6"
                            max="26"
                            step="0.5"
                            value={el.fontSize || 12}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                [elKey]: { ...el, fontSize: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Ketebalan (Weight)
                          </label>
                          <select
                            value={el.fontWeight || 'normal'}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                [elKey]: { ...el, fontWeight: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="normal">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="bold">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                          </select>
                        </div>
                      </div>

                      {/* Color & Align */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Warna Teks
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={el.color || '#ffffff'}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  [elKey]: { ...el, color: e.target.value },
                                })
                              }
                              className="w-7 h-7 rounded border-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={el.color || '#ffffff'}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  [elKey]: { ...el, color: e.target.value },
                                })
                              }
                              className="flex-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Perataan (Align)
                          </label>
                          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                            {(['left', 'center', 'right'] as TextAlign[]).map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() =>
                                  setCurrentTemplate({
                                    ...currentTemplate,
                                    [elKey]: { ...el, align: a },
                                  })
                                }
                                className={`flex-1 py-1 font-semibold uppercase text-[10px] ${
                                  el.align === a
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500'
                                }`}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Coordinate Sliders (X & Y %) */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Posisi Pada Kartu (atau geser langsung di kanvas)
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px]">Posisi X: {el.x}%</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={el.x}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  [elKey]: { ...el, x: Number(e.target.value) },
                                })
                              }
                              className="w-full accent-amber-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px]">Posisi Y: {el.y}%</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={el.y}
                              onChange={(e) =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  [elKey]: { ...el, y: Number(e.target.value) },
                                })
                              }
                              className="w-full accent-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBTAB 3: FOTO */}
            {activeSubTab === 'photo' && (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bentuk Bingkai Foto
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'circle', label: 'Lingkaran', icon: 'rounded-full' },
                      { id: 'rounded', label: 'Persegi Melengkung', icon: 'rounded-lg' },
                      { id: 'square', label: 'Persegi Tegak', icon: 'rounded-none' },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            photo: { ...currentTemplate.photo, shape: shape.id as PhotoShape },
                          })
                        }
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 font-medium ${
                          currentTemplate.photo.shape === shape.id
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <div className={`w-7 h-7 border-2 border-current ${shape.icon}`} />
                        <span className="text-[10px] text-center">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Ukuran Foto: {currentTemplate.photo.width} mm
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="45"
                      value={currentTemplate.photo.width}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          photo: {
                            ...currentTemplate.photo,
                            width: Number(e.target.value),
                            height: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tebal Bingkai: {currentTemplate.photo.borderWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={currentTemplate.photo.borderWidth}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          photo: { ...currentTemplate.photo, borderWidth: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Warna Bingkai Foto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTemplate.photo.borderColor}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          photo: { ...currentTemplate.photo, borderColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTemplate.photo.borderColor}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          photo: { ...currentTemplate.photo, borderColor: e.target.value },
                        })
                      }
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Posisi Foto Pada Kartu
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px]">Posisi X: {currentTemplate.photo.x}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={currentTemplate.photo.x}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            photo: { ...currentTemplate.photo, x: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px]">Posisi Y: {currentTemplate.photo.y}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={currentTemplate.photo.y}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            photo: { ...currentTemplate.photo, y: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTemplate.photo.shadow}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        photo: { ...currentTemplate.photo, shadow: e.target.checked },
                      })
                    }
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Beri Efek Bayangan (Drop Shadow) pada Foto</span>
                </label>
              </div>
            )}

            {/* SUBTAB 4: WARNA / TEMA / BACKGROUND */}
            {activeSubTab === 'colors' && (
              <div className="space-y-4">
                {/* Custom Background Image Upload */}
                <div className="p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Unggah Gambar Template Kustom (PNG/JPG)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Gunakan file desain siap pakai buatan Photoshop/Canva sebagai latar belakang kartu.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleBackgroundUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {currentTemplate.backgroundImage && (
                      <button
                        onClick={() => setCurrentTemplate({ ...currentTemplate, backgroundImage: undefined })}
                        className="text-rose-500 hover:text-rose-400 font-bold px-2 py-1"
                        title="Hapus gambar latar"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Gradasi Warna */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Preset Gradasi Desain
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: 'Navy Gold (PGRI Resmi)',
                        c1: '#0f172a',
                        c2: '#1e293b',
                        c3: '#0f2744',
                        border: '#eab308',
                      },
                      {
                        label: 'Royal Indigo Modern',
                        c1: '#4338ca',
                        c2: '#6366f1',
                        c3: '#312e81',
                        border: '#818cf8',
                      },
                      {
                        label: 'Emerald Instansi / ASN',
                        c1: '#064e3b',
                        c2: '#047857',
                        c3: '#022c22',
                        border: '#10b981',
                      },
                      {
                        label: 'Clean Minimalist White',
                        c1: '#ffffff',
                        c2: '#f8fafc',
                        c3: '#f1f5f9',
                        border: '#cbd5e1',
                      },
                      {
                        label: 'Dark Ruby / VIP Access',
                        c1: '#18181b',
                        c2: '#27272a',
                        c3: '#09090b',
                        border: '#f43f5e',
                      },
                      {
                        label: 'Ocean Cyan School Pass',
                        c1: '#083344',
                        c2: '#0e7490',
                        c3: '#155e75',
                        border: '#06b6d4',
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            backgroundImage: undefined,
                            backgroundGradient: {
                              enabled: true,
                              type: 'linear',
                              direction: 'to bottom',
                              color1: preset.c1,
                              color2: preset.c2,
                              color3: preset.c3,
                            },
                            borderColor: preset.border,
                            accentBarColor: preset.border,
                          })
                        }
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:border-amber-400 transition text-left"
                      >
                        <div
                          className="w-5 h-5 rounded-md flex-shrink-0 border border-slate-400/30"
                          style={{
                            background: `linear-gradient(to bottom right, ${preset.c1}, ${preset.c2})`,
                          }}
                        />
                        <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pola / Pattern Overlay */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Efek Pola Tekstur Latar
                  </label>
                  <select
                    value={currentTemplate.patternOverlay || 'none'}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        patternOverlay: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="none">Polos (Tanpa Tekstur)</option>
                    <option value="geometric">Geometrik Modern</option>
                    <option value="dots">Bintik Halus (Dots)</option>
                    <option value="waves">Gelombang Halus (Waves)</option>
                  </select>
                </div>
              </div>
            )}

            {/* SUBTAB 5: LOGOS & QR CODE */}
            {activeSubTab === 'logos' && (
              <div className="space-y-4">
                {/* Logo 1 */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Logo 1 (Instansi/Sekolah)</label>
                    <input
                      type="checkbox"
                      checked={currentTemplate.logo1.visible}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          logo1: { ...currentTemplate.logo1, visible: e.target.checked },
                        })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                  </div>

                  {currentTemplate.logo1.visible && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'logo1')}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-amber-500 file:text-slate-950 cursor-pointer"
                      />
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span>Posisi X: {currentTemplate.logo1.x}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentTemplate.logo1.x}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                logo1: { ...currentTemplate.logo1, x: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                        <div>
                          <span>Posisi Y: {currentTemplate.logo1.y}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentTemplate.logo1.y}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                logo1: { ...currentTemplate.logo1, y: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logo 2 */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">Logo 2 (Sponsor/Organisasi)</label>
                    <input
                      type="checkbox"
                      checked={currentTemplate.logo2.visible}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          logo2: { ...currentTemplate.logo2, visible: e.target.checked },
                        })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                  </div>

                  {currentTemplate.logo2.visible && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'logo2')}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-amber-500 file:text-slate-950 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* QR Code Settings */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">QR Code Verifikasi</label>
                    <input
                      type="checkbox"
                      checked={currentTemplate.qrCode.visible}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          qrCode: { ...currentTemplate.qrCode, visible: e.target.checked },
                        })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                  </div>

                  {currentTemplate.qrCode.visible && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400">Data yang dikodekan ke QR:</label>
                        <select
                          value={currentTemplate.qrCode.payloadType}
                          onChange={(e) =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              qrCode: { ...currentTemplate.qrCode, payloadType: e.target.value as any },
                            })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="id">Nomor Identitas Peserta</option>
                          <option value="url">Link Verifikasi Online</option>
                          <option value="vcard">Kontak vCard Lengkap</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span>Posisi X: {currentTemplate.qrCode.x}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentTemplate.qrCode.x}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                qrCode: { ...currentTemplate.qrCode, x: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                        <div>
                          <span>Posisi Y: {currentTemplate.qrCode.y}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentTemplate.qrCode.y}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                qrCode: { ...currentTemplate.qrCode, y: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Live Canvas with Scale Control (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Kanvas Desain Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                <Move className="w-3 h-3" /> Drag & Drop Aktif
              </span>
            </div>

            {/* Scale controls */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 text-xs">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.9, prev - 0.1))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300 px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(2.0, prev + 0.1))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Working Zone */}
          <div className="w-full min-h-[520px] py-8 px-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden relative">
            <CardCanvas
              template={currentTemplate}
              peserta={samplePeserta}
              scale={zoomScale}
              isEditable={true}
              activeElement={activeElementKey}
              onSelectElement={(elKey) => setActiveElementKey(elKey)}
              onElementMove={handleElementMove}
            />
          </div>

          <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              💡 <em>Tips: Klik dan tahan elemen apa saja pada kartu di atas untuk menggeser posisinya secara bebas.</em>
            </span>
            <span className="font-mono">CR-80: 54 × 86 mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
