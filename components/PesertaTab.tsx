'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  Printer,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  CheckCircle2,
  Sparkles,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { Peserta, IDCardTemplate, UserRole } from '@/types/idcard';

interface PesertaTabProps {
  pesertaList: Peserta[];
  templates: IDCardTemplate[];
  onSavePeserta: (pesertaData: Partial<Peserta>) => void;
  onDeletePeserta: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkPrint: (pesertaList: Peserta[]) => void;
  onPreviewCard: (peserta: Peserta) => void;
  currentRole: UserRole;
}

export const PesertaTab: React.FC<PesertaTabProps> = ({
  pesertaList,
  templates,
  onSavePeserta,
  onDeletePeserta,
  onBulkDelete,
  onBulkPrint,
  onPreviewCard,
  currentRole,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);

  // Form states for Modal
  const [formNama, setFormNama] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formInstansi, setFormInstansi] = useState('');
  const [formNoIdentitas, setFormNoIdentitas] = useState('');
  const [formMasaBerlaku, setFormMasaBerlaku] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Import Validation states
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importedPreview, setImportedPreview] = useState<Partial<Peserta>[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filtered List
  const filteredPeserta = pesertaList.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      p.nama.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q) ||
      p.instansi.toLowerCase().includes(q) ||
      p.kegiatan.toLowerCase().includes(q) ||
      p.noIdentitas.toLowerCase().includes(q);

    const matchTemplate = filterTemplate === 'all' || p.templateId === filterTemplate;
    return matchQuery && matchTemplate;
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredPeserta.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPeserta.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingPeserta(null);
    setFormNama('');
    setFormJabatan('Anggota Panitia');
    setFormKegiatan('Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026');
    setFormInstansi('Kecamatan Pasirwangi');
    setFormNoIdentitas(`PAN-PGRI-2026-${String(pesertaList.length + 1).padStart(3, '0')}`);
    setFormMasaBerlaku('25 November 2026');
    setFormFotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
    setFormTemplateId(templates[0]?.id || 'tpl-pgri-2026');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (p: Peserta) => {
    setEditingPeserta(p);
    setFormNama(p.nama);
    setFormJabatan(p.jabatan);
    setFormKegiatan(p.kegiatan);
    setFormInstansi(p.instansi);
    setFormNoIdentitas(p.noIdentitas);
    setFormMasaBerlaku(p.masaBerlaku || '');
    setFormFotoUrl(p.fotoUrl);
    setFormTemplateId(p.templateId);
    setFormCatatan(p.catatan || '');
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      alert('Nama lengkap tidak boleh kosong!');
      return;
    }

    onSavePeserta({
      id: editingPeserta?.id,
      nama: formNama,
      jabatan: formJabatan,
      kegiatan: formKegiatan,
      instansi: formInstansi,
      noIdentitas: formNoIdentitas,
      masaBerlaku: formMasaBerlaku,
      fotoUrl: formFotoUrl,
      templateId: formTemplateId,
      catatan: formCatatan,
    });

    setIsModalOpen(false);
  };

  // Photo upload in modal
  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormFotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const targetList = selectedIds.length > 0
      ? pesertaList.filter((p) => selectedIds.includes(p.id))
      : pesertaList;

    const headers = [
      'Nomor',
      'Nama Lengkap',
      'Jabatan',
      'Keterangan Kegiatan',
      'Instansi/Sekolah',
      'Nomor Identitas',
      'Masa Berlaku',
      'ID Template',
      'URL Foto',
    ];

    const rows = targetList.map((p, idx) => [
      idx + 1,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.jabatan.replace(/"/g, '""')}"`,
      `"${p.kegiatan.replace(/"/g, '""')}"`,
      `"${p.instansi.replace(/"/g, '""')}"`,
      `"${p.noIdentitas.replace(/"/g, '""')}"`,
      `"${(p.masaBerlaku || '').replace(/"/g, '""')}"`,
      `"${p.templateId}"`,
      `"${p.fotoUrl}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Peserta_IDCard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sample = `Nama Lengkap,Jabatan,Keterangan Kegiatan,Instansi,Nomor Identitas,Masa Berlaku,URL Foto
ASEP SURYANA S.Pd.,Ketua Panitia,Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026,Kecamatan Pasirwangi,PAN-PGRI-2026-001,25 November 2026,https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400
SITI NURHALIZA S.Pd.,Bendahara,Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026,SMPN 2 Pasirwangi,PAN-PGRI-2026-002,25 November 2026,https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,\uFEFF' + sample);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Format_Contoh_Impor_Peserta.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload & parsing with column validation
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setImportedPreview([]);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');

      if (lines.length < 2) {
        setImportErrors(['File CSV kosong atau hanya memiliki baris header.']);
        return;
      }

      // Parse headers
      const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const requiredColumns = ['nama lengkap', 'jabatan', 'instansi'];
      const missingColumns = requiredColumns.filter((col) => !rawHeaders.some((h) => h.includes(col.split(' ')[0])));

      if (missingColumns.length > 0) {
        setImportErrors([
          `Format kolom tidak lengkap! Kolom wajib berikut tidak ditemukan: ${missingColumns.join(', ')}. Harap periksa format file CSV Anda.`,
        ]);
        return;
      }

      const parsedRows: Partial<Peserta>[] = [];
      const validationWarnings: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Split with regex taking quotes into account
        const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ''));

        const namaVal = cells[0] || '';
        const jabatanVal = cells[1] || '';
        const kegiatanVal = cells[2] || 'Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026';
        const instansiVal = cells[3] || 'Kecamatan Pasirwangi';
        const noIdVal = cells[4] || `PAN-PGRI-2026-${String(pesertaList.length + i).padStart(3, '0')}`;
        const berlakuVal = cells[5] || '25 November 2026';
        const fotoVal = cells[6] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

        if (!namaVal) {
          validationWarnings.push(`Baris ${i + 1}: Nama peserta kosong! Baris dilewati.`);
          continue;
        }

        parsedRows.push({
          nama: namaVal,
          jabatan: jabatanVal || 'Anggota',
          kegiatan: kegiatanVal,
          instansi: instansiVal,
          noIdentitas: noIdVal,
          masaBerlaku: berlakuVal,
          fotoUrl: fotoVal,
          templateId: templates[0]?.id || 'tpl-pgri-2026',
        });
      }

      if (validationWarnings.length > 0) {
        setImportErrors(validationWarnings);
      }

      setImportedPreview(parsedRows);
      setImportStatus(`Berhasil membaca ${parsedRows.length} data peserta dari CSV.`);
    };

    reader.readAsText(file);
  };

  // Confirm Import
  const handleCommitImport = () => {
    if (importedPreview.length === 0) return;
    importedPreview.forEach((item) => {
      onSavePeserta(item);
    });
    setIsImportModalOpen(false);
    setImportedPreview([]);
    setImportErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-['Montserrat']">
              Pengelolaan Data Peserta & Panitia
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data tersinkron dengan Sheet <strong>PESERTA</strong> di Google Spreadsheet. Mendukung impor/ekspor CSV & cetak massal.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            disabled={currentRole === 'Viewer'}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV / Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {currentRole !== 'Viewer' && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peserta</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Bulk Action Toolbar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search & Filter */}
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, jabatan, sekolah/instansi, no identitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none"
            >
              <option value="all">Semua Template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <span className="font-bold text-amber-500">
              {selectedIds.length} Terpilih
            </span>
            <button
              onClick={() => {
                const selected = pesertaList.filter((p) => selectedIds.includes(p.id));
                onBulkPrint(selected);
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 transition"
            >
              <Printer className="w-3 h-3" />
              <span>Cetak Terpilih</span>
            </button>
            {currentRole !== 'Viewer' && (
              <button
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus ${selectedIds.length} peserta terpilih?`)) {
                    onBulkDelete(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700/60 select-none">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-amber-500"
                    title="Pilih Semua"
                  >
                    {selectedIds.length === filteredPeserta.length && filteredPeserta.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Foto & Nama Lengkap</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Instansi / Sekolah</th>
                <th className="px-4 py-3">Keterangan Kegiatan</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredPeserta.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Tidak ada data peserta ditemukan.</p>
                    <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau tambah peserta baru.</p>
                  </td>
                </tr>
              ) : (
                filteredPeserta.map((peserta, idx) => {
                  const isSelected = selectedIds.includes(peserta.id);
                  const tpl = templates.find((t) => t.id === peserta.templateId) || templates[0];

                  return (
                    <tr
                      key={peserta.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                        isSelected ? 'bg-amber-500/10 dark:bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleSelect(peserta.id)}
                          className="text-slate-400 hover:text-amber-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={peserta.fotoUrl}
                            alt={peserta.nama}
                            className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {peserta.nama}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {peserta.noIdentitas}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {peserta.jabatan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {peserta.instansi}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={peserta.kegiatan}>
                        {peserta.kegiatan}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300 truncate block max-w-[130px]" title={tpl?.name}>
                          {tpl?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPreviewCard(peserta)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-500 transition"
                            title="Pratinjau ID Card"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentRole !== 'Viewer' && (
                            <button
                              onClick={() => handleOpenEditModal(peserta)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-sky-500 transition"
                              title="Edit Data"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {currentRole !== 'Viewer' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus peserta "${peserta.nama}"?`)) {
                                  onDeletePeserta(peserta.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Menampilkan <strong>{filteredPeserta.length}</strong> dari <strong>{pesertaList.length}</strong> total peserta
          </span>
          <span className="text-slate-400">Database: Google Spreadsheet ID 1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU</span>
        </div>
      </div>

      {/* MODAL 1: Tambah / Edit Peserta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Montserrat']">
                {editingPeserta ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {/* Foto Profil Preview & Upload */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Foto Peserta
                </label>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formFotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                    alt="Foto"
                    className="w-12 h-12 rounded-full object-cover border border-amber-500 shadow-sm"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalPhotoUpload}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-amber-500 file:text-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: ASEP SURYANA, S.Pd."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jabatan / Peran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Ketua Panitia"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor Identitas
                  </label>
                  <input
                    type="text"
                    value={formNoIdentitas}
                    onChange={(e) => setFormNoIdentitas(e.target.value)}
                    placeholder="PAN-PGRI-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Keterangan Kegiatan
                </label>
                <textarea
                  rows={2}
                  value={formKegiatan}
                  onChange={(e) => setFormKegiatan(e.target.value)}
                  placeholder="Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Instansi / Sekolah
                  </label>
                  <input
                    type="text"
                    value={formInstansi}
                    onChange={(e) => setFormInstansi(e.target.value)}
                    placeholder="Kecamatan Pasirwangi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Masa Berlaku
                  </label>
                  <input
                    type="text"
                    value={formMasaBerlaku}
                    onChange={(e) => setFormMasaBerlaku(e.target.value)}
                    placeholder="25 November 2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Template ID Card
                </label>
                <select
                  value={formTemplateId}
                  onChange={(e) => setFormTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Impor Massal CSV & Validasi */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Montserrat']">
                  Impor Data Peserta dari CSV / Excel
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-500">Unduh Format Contoh CSV</p>
                  <p className="text-[11px] text-slate-400">Gunakan file contoh ini agar kolom sesuai dan valid.</p>
                </div>
                <button
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Unduh Contoh CSV
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih File CSV (*.csv)
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Error messages if validation fails */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Peringatan Validasi Kolom / Data:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-rose-400 space-y-0.5">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success summary & table preview */}
              {importStatus && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importedPreview.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Pratinjau Data yang Akan Diimpor ({importedPreview.length} Peserta):
                  </span>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <tr>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Jabatan</th>
                          <th className="p-2">Instansi</th>
                          <th className="p-2">No ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importedPreview.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-semibold text-slate-900 dark:text-white">{item.nama}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-300">{item.jabatan}</td>
                            <td className="p-2 text-slate-500 dark:text-slate-400">{item.instansi}</td>
                            <td className="p-2 font-mono text-slate-400">{item.noIdentitas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importedPreview.length === 0}
                  onClick={handleCommitImport}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  Impor Sekarang ({importedPreview.length} Data)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
