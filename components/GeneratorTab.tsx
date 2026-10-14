'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Save,
  Download,
  Printer,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileImage,
  FileText,
  RefreshCw,
  Sliders,
  User,
  Building,
  Calendar,
  Eye
} from 'lucide-react';
import { Peserta, IDCardTemplate, UserRole } from '@/types/idcard';
import { CardCanvas } from '@/components/CardCanvas';
import { exportElementAsPng, exportElementAsJpeg, exportElementAsPdf } from '@/lib/exportUtils';

interface GeneratorTabProps {
  templates: IDCardTemplate[];
  pesertaList: Peserta[];
  onSavePeserta: (pesertaData: Partial<Peserta>) => void;
  currentRole: UserRole;
  initialPeserta?: Peserta | null;
}

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  templates,
  pesertaList,
  onSavePeserta,
  currentRole,
  initialPeserta,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialPeserta?.templateId || templates[0]?.id || 'tpl-pgri-2026'
  );

  // Form states
  const [nama, setNama] = useState<string>(initialPeserta?.nama || 'ASEP SURYANA, S.Pd.');
  const [jabatan, setJabatan] = useState<string>(initialPeserta?.jabatan || 'Ketua Panitia');
  const [kegiatan, setKegiatan] = useState<string>(
    initialPeserta?.kegiatan || 'Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026'
  );
  const [instansi, setInstansi] = useState<string>(initialPeserta?.instansi || 'Kecamatan Pasirwangi');
  const [noIdentitas, setNoIdentitas] = useState<string>(
    initialPeserta?.noIdentitas || `PAN-PGRI-2026-00${pesertaList.length + 1}`
  );
  const [masaBerlaku, setMasaBerlaku] = useState<string>(initialPeserta?.masaBerlaku || '25 November 2026');
  const [fotoUrl, setFotoUrl] = useState<string>(
    initialPeserta?.fotoUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  );
  const [catatan, setCatatan] = useState<string>(initialPeserta?.catatan || '');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [customTemplateBg, setCustomTemplateBg] = useState<string | null>(null);

  const cardContainerRef = useRef<HTMLDivElement | null>(null);

  const baseTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const activeTemplate: IDCardTemplate = customTemplateBg
    ? { ...baseTemplate, backgroundImage: customTemplateBg }
    : baseTemplate;

  // Custom template background upload handler
  const handleTemplateBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran file gambar template maksimal 8 MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomTemplateBg(event.target?.result as string);
        setStatusMessage({
          text: 'Gambar desain template sendiri berhasil diterapkan ke ID Card!',
          type: 'success',
        });
        setTimeout(() => setStatusMessage(null), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto maksimal 5 MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoUrl(event.target?.result as string);
        setStatusMessage({ text: 'Foto berhasil diperbarui!', type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save handler
  const handleSave = () => {
    if (!nama.trim()) {
      alert('Nama lengkap wajib diisi!');
      return;
    }
    const newPeserta: Partial<Peserta> = {
      id: initialPeserta?.id,
      nama,
      jabatan,
      kegiatan,
      instansi,
      noIdentitas,
      fotoUrl,
      templateId: selectedTemplateId,
      masaBerlaku,
      catatan,
    };
    onSavePeserta(newPeserta);
    setStatusMessage({
      text: `ID Card untuk "${nama}" berhasil disimpan ke database!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Reset for next ID card
  const handleNextCard = () => {
    const nextNum = pesertaList.length + 2;
    setNama('');
    setJabatan('Anggota Panitia');
    setNoIdentitas(`PAN-PGRI-2026-${String(nextNum).padStart(3, '0')}`);
    setCatatan('');
    setFotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400');
    setStatusMessage({ text: 'Formulir siap untuk ID Card berikutnya!', type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Export handlers
  const handleExportPng = async () => {
    if (!cardContainerRef.current) return;
    try {
      setIsExporting(true);
      const filename = `IDCard_${nama.replace(/\s+/g, '_')}_${noIdentitas}.png`;
      await exportElementAsPng(cardContainerRef.current, filename, 3);
      setStatusMessage({ text: 'Berhasil mengunduh gambar PNG kualitas tinggi!', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Gagal mengunduh PNG. Silakan coba lagi.', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleExportJpg = async () => {
    if (!cardContainerRef.current) return;
    try {
      setIsExporting(true);
      const filename = `IDCard_${nama.replace(/\s+/g, '_')}_${noIdentitas}.jpg`;
      await exportElementAsJpeg(cardContainerRef.current, filename, 3);
      setStatusMessage({ text: 'Berhasil mengunduh gambar JPG!', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Gagal mengunduh JPG.', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleExportPdf = async () => {
    if (!cardContainerRef.current) return;
    try {
      setIsExporting(true);
      const filename = `IDCard_${nama.replace(/\s+/g, '_')}.pdf`;
      await exportElementAsPdf(
        cardContainerRef.current,
        filename,
        activeTemplate.orientation,
        activeTemplate.widthMm,
        activeTemplate.heightMm
      );
      setStatusMessage({ text: 'Berhasil membuat file PDF siap cetak!', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Gagal mengekspor PDF.', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Sample data quick presets for easy testing
  const applyPreset = (presetName: string) => {
    if (presetName === 'ketua') {
      setNama('ASEP SURYANA, S.Pd.');
      setJabatan('Ketua Panitia');
      setInstansi('Kecamatan Pasirwangi');
      setNoIdentitas('PAN-PGRI-2026-001');
      setKegiatan('Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026');
      setSelectedTemplateId('tpl-pgri-2026');
    } else if (presetName === 'pemateri') {
      setNama('DR. H. AHMAD FAUZI, M.Ag.');
      setJabatan('Narasumber Utama');
      setInstansi('Universitas Pendidikan Indonesia');
      setNoIdentitas('SEM-2026-014');
      setKegiatan('Seminar Nasional Penguatan Guru Profesional Abad 21');
      setSelectedTemplateId('tpl-seminar-modern');
    } else if (presetName === 'pegawai') {
      setNama('HENDRA PRASETYO, S.STP.');
      setJabatan('Kepala Subbagian Kepegawaian');
      setInstansi('Badan Kepegawaian Daerah');
      setNoIdentitas('198504122010011008');
      setKegiatan('Pelayanan Publik & Pembinaan Aparatur Sipil Negara');
      setSelectedTemplateId('tpl-pegawai-instansi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-['Montserrat']">
              Generator ID Card Digital Instan
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gabungkan template, foto, dan data peserta secara langsung. Unduh dalam format PNG, JPG, atau PDF beresolusi tinggi.
          </p>
        </div>

        {/* Quick sample fillers */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">Contoh Cepat:</span>
          <button
            onClick={() => applyPreset('ketua')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold text-xs transition"
          >
            Panitia PGRI
          </button>
          <button
            onClick={() => applyPreset('pemateri')}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs transition"
          >
            Seminar
          </button>
          <button
            onClick={() => applyPreset('pegawai')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition"
          >
            Pegawai ASN
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Left Form (5 cols), Right Live Canvas + Action buttons (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Input (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 space-y-4 text-xs">
          <div className="border-b border-slate-200 dark:border-slate-700/60 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm font-['Montserrat'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Data Identitas Pemilik Kartu</span>
            </h2>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-400">
              Auto-Preview
            </span>
          </div>

          {/* 1. Pilih Template & Unggah Desain Sendiri */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              1. Pilihan Desain Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.orientation === 'portrait' ? 'Potret' : 'Lanskap'})
                </option>
              ))}
            </select>

            {/* Kotak Input Unggah Gambar Template Kustom */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-dashed border-amber-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-500 flex items-center gap-1.5 text-[11px]">
                  <FileImage className="w-3.5 h-3.5" />
                  <span>Unggah Gambar Desain Sendiri (PNG/JPG)</span>
                </span>
                {customTemplateBg && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    Desain Kustom Aktif
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Punya desain buatan sendiri dari Canva/Photoshop? Unggah di sini untuk dijadikan latar belakang kartu ID.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleTemplateBgUpload}
                  className="block w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                {customTemplateBg && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTemplateBg(null);
                      setStatusMessage({
                        text: 'Kembali menggunakan desain preset bawaan.',
                        type: 'success',
                      });
                      setTimeout(() => setStatusMessage(null), 3000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold flex-shrink-0 transition"
                    title="Hapus gambar desain sendiri"
                  >
                    Reset Preset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Pengelolaan Foto */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              2. Foto Pemilik Kartu
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoUrl}
                alt="Pratinjau Foto"
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-sm flex-shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handlePhotoUpload}
                  className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Unggah dari HP / Komputer (Maks 5MB)
                </span>
              </div>
            </div>
          </div>

          {/* 3. Nama Lengkap */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              3. Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: ASEP SURYANA, S.Pd."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
            />
          </div>

          {/* 4. Jabatan / Peran */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              4. Jabatan / Peran Kegiatan *
            </label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Contoh: Ketua Panitia, Pemateri, Anggota"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* 5. Keterangan Kegiatan */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              5. Keterangan Kegiatan
            </label>
            <textarea
              rows={2}
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              placeholder="Contoh: Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          {/* 6. Instansi & Nomor Identitas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                6. Instansi / Sekolah
              </label>
              <input
                type="text"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                placeholder="Contoh: Kecamatan Pasirwangi"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                7. Nomor Identitas / No ID
              </label>
              <input
                type="text"
                value={noIdentitas}
                onChange={(e) => setNoIdentitas(e.target.value)}
                placeholder="PAN-PGRI-2026-001"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* 8. Masa Berlaku */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Masa Berlaku
              </label>
              <input
                type="text"
                value={masaBerlaku}
                onChange={(e) => setMasaBerlaku(e.target.value)}
                placeholder="25 November 2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Catatan Panitia
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Opsional (cth: PJ Panggung)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action Save & Next Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Simpan ID Card</span>
            </button>

            <button
              onClick={handleNextCard}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition flex items-center justify-center gap-1.5"
              title="Bersihkan formulir untuk ID Card berikutnya"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Buat ID Card Berikutnya</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Card Canvas & Multi-Format Download Studio (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base font-['Montserrat'] flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Pratinjau Hasil ID Card</span>
              </h2>
              <span className="text-xs text-slate-400">
                Ukuran cetak standar CR-80 (54 × 86 mm)
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">
              {activeTemplate.name}
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div
            id="print-single-card"
            className="w-full min-h-[480px] py-6 px-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden"
          >
            <div ref={cardContainerRef}>
              <CardCanvas
                template={activeTemplate}
                peserta={{
                  nama,
                  jabatan,
                  kegiatan,
                  instansi,
                  noIdentitas,
                  masaBerlaku,
                  fotoUrl,
                }}
                scale={1.4}
                isEditable={false}
              />
            </div>
          </div>

          {/* Action Download Buttons required by Section 7 */}
          <div className="w-full mt-5 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Pilihan Ekspor & Cetak
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Unduh PNG */}
              <button
                onClick={handleExportPng}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm disabled:opacity-50"
              >
                <FileImage className="w-4 h-4 text-amber-400" />
                <span>Unduh PNG</span>
              </button>

              {/* Unduh JPG */}
              <button
                onClick={handleExportJpg}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Unduh JPG</span>
              </button>

              {/* Unduh PDF */}
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Unduh PDF</span>
              </button>

              {/* Cetak Langsung */}
              <button
                onClick={handleBrowserPrint}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs transition flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-600/20"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak Kartu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
