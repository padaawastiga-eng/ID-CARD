export const SPREADSHEET_ID = '1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU';

export const CODE_GS_CONTENT = `/**
 * ============================================================================
 * APLIKASI PEMBUAT ID CARD DIGITAL MULTIFUNGSI (VERSI TERBARU 2.2.0)
 * Backend: Google Apps Script (Code.gs)
 * Database: Google Spreadsheet (ID: 1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU)
 * Storage Foto & Desain Template: Google Drive
 * ============================================================================
 */

// KONFIGURASI UTAMA
var CONFIG = {
  SPREADSHEET_ID: "${SPREADSHEET_ID}", // Google Spreadsheet ID
  DRIVE_FOLDER_ID: "", // Opsional: ID Folder Google Drive (kosongkan jika otomatis membuat folder baru)
  FOLDER_NAME: "ID_CARD_DIGITAL_STORAGE", // Nama folder di Google Drive
  APP_NAME: "Pembuat ID Card Digital Multifungsi",
  VERSI: "2.2.0"
};

/**
 * 1. MENAMPILKAN WEB APP (GET REQUEST)
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  var template = HtmlService.createTemplateFromFile('Index');
  template.appName = CONFIG.APP_NAME;
  template.spreadsheetId = CONFIG.SPREADSHEET_ID;

  return template.evaluate()
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 2. MENERIMA DATA DARI FRONTEND / API ENDPOINT (POST REQUEST)
 */
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;

    var result = { success: false, message: "Aksi tidak dikenal" };

    switch (action) {
      case "initDatabase":
        result = setupDatabase();
        break;
      case "getData":
        result = getAllData();
        break;
      case "savePeserta":
        result = simpanDataPeserta(data.payload);
        break;
      case "deletePeserta":
        result = hapusDataPeserta(data.id);
        break;
      case "saveTemplate":
        result = simpanDataTemplate(data.payload);
        break;
      case "deleteTemplate":
        result = hapusDataTemplate(data.id);
        break;
      case "saveKegiatan":
        result = simpanDataKegiatan(data.payload);
        break;
      case "uploadFotoDrive":
        result = simpanFotoKeDrive(data.base64, data.filename, data.mimeType);
        break;
      case "uploadTemplateDrive":
        result = simpanTemplateKeDrive(data.base64, data.filename, data.mimeType);
        break;
      case "ping":
        result = { 
          success: true, 
          message: "Koneksi Google Apps Script & Google Spreadsheet Aktif!", 
          spreadsheetId: CONFIG.SPREADSHEET_ID,
          timestamp: new Date().toISOString() 
        };
        break;
      default:
        result = { success: false, message: "Action '" + action + "' tidak didukung." };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResponse = { success: false, error: error.toString(), stack: error.stack };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 3. INISIALISASI DATABASE & 5 SHEET SPREADSHEET OTOMATIS
 * Jalankan fungsi ini pertama kali dari Apps Script Editor
 */
function setupDatabase() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    var sheetsConfig = {
      "PENGATURAN": [
        ["Kunci", "Nilai", "Keterangan"],
        ["APP_NAME", CONFIG.APP_NAME, "Nama Resmi Aplikasi"],
        ["INSTANSI", "Kecamatan Pasirwangi", "Nama Instansi / Penyelenggara"],
        ["DEFAULT_KEGIATAN", "Peringatan HGN dan HUT ke-81 PGRI Tahun 2026", "Kegiatan Utama Aktif"],
        ["VERSI_DB", "2.2", "Versi Struktur Database"]
      ],
      "TEMPLATE": [
        ["ID", "Nama Template", "Kategori", "Orientasi", "Lebar (mm)", "Tinggi (mm)", "Warna Latar", "URL Gambar Template", "Konfigurasi JSON", "Tanggal Dibuat"]
      ],
      "PESERTA": [
        ["ID", "Nomor", "Nama Lengkap", "Jabatan", "Keterangan Kegiatan", "Instansi", "Nomor Identitas", "URL Foto", "ID Template", "Masa Berlaku", "Catatan", "Tanggal Dibuat"]
      ],
      "KEGIATAN": [
        ["ID", "Nama Kegiatan", "Tanggal Mulai", "Tanggal Selesai", "Lokasi", "Keterangan", "Status"]
      ],
      "LOG_AKTIVITAS": [
        ["ID", "Waktu", "Aksi", "Pengguna", "Keterangan"]
      ]
    };

    var created = [];
    for (var sheetName in sheetsConfig) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        var initialData = sheetsConfig[sheetName];
        sheet.getRange(1, 1, initialData.length, initialData[0].length).setValues(initialData);

        // Styling header
        var headerRange = sheet.getRange(1, 1, 1, initialData[0].length);
        headerRange.setBackground("#0f172a");
        headerRange.setFontColor("#f8fafc");
        headerRange.setFontWeight("bold");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
        created.push(sheetName);
      }
    }

    // Seed default template jika TEMPLATE baru dibuat
    var tplSheet = ss.getSheetByName("TEMPLATE");
    if (tplSheet && tplSheet.getLastRow() <= 1) {
      tplSheet.appendRow([
        "tpl-pgri-2026",
        "Panitia Peringatan HGN & HUT ke-81 PGRI (Resmi)",
        "organisasi",
        "portrait",
        54,
        86,
        "#0c1a30",
        "",
        JSON.stringify({
          name: "Panitia PGRI 2026",
          theme: "navy-gold",
          accentColor: "#eab308"
        }),
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);
    }

    // Seed default peserta jika PESERTA baru dibuat
    var pSheet = ss.getSheetByName("PESERTA");
    if (pSheet && pSheet.getLastRow() <= 1) {
      pSheet.appendRow([
        "peserta-001",
        1,
        "ASEP SURYANA, S.Pd.",
        "Ketua Panitia",
        "Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026",
        "Kecamatan Pasirwangi",
        "PAN-PGRI-2026-001",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        "tpl-pgri-2026",
        "25 November 2026",
        "Koordinator Pelaksana Utama",
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);
    }

    catatLog("Inisialisasi Database", "Database berhasil diinisialisasi otomatis.", "Sistem");

    return {
      success: true,
      message: "Database dan semua Sheet berhasil disiapkan!",
      sheetsCreated: created
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 4. MENGAMBIL SELURUH DATA DARI GOOGLE SPREADSHEET
 */
function getAllData() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // Ambil Peserta
    var pesertaList = [];
    var pSheet = ss.getSheetByName("PESERTA");
    if (pSheet && pSheet.getLastRow() > 1) {
      var pValues = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, 12).getValues();
      for (var i = 0; i < pValues.length; i++) {
        var row = pValues[i];
        if (row[0]) {
          pesertaList.push({
            id: String(row[0]),
            nomor: Number(row[1]) || (i + 1),
            nama: String(row[2] || ""),
            jabatan: String(row[3] || ""),
            kegiatan: String(row[4] || ""),
            instansi: String(row[5] || ""),
            noIdentitas: String(row[6] || ""),
            fotoUrl: String(row[7] || ""),
            templateId: String(row[8] || "tpl-pgri-2026"),
            masaBerlaku: String(row[9] || ""),
            catatan: String(row[10] || ""),
            createdAt: String(row[11] || "")
          });
        }
      }
    }

    // Ambil Template
    var templateList = [];
    var tSheet = ss.getSheetByName("TEMPLATE");
    if (tSheet && tSheet.getLastRow() > 1) {
      var tValues = tSheet.getRange(2, 1, tSheet.getLastRow() - 1, 10).getValues();
      for (var j = 0; j < tValues.length; j++) {
        var tRow = tValues[j];
        if (tRow[0]) {
          var configObj = {};
          try {
            configObj = JSON.parse(tRow[8]);
          } catch(e) {}

          templateList.push({
            id: String(tRow[0]),
            name: String(tRow[1]),
            category: String(tRow[2]),
            orientation: String(tRow[3]),
            widthMm: Number(tRow[4]) || 54,
            heightMm: Number(tRow[5]) || 86,
            backgroundColor: String(tRow[6]),
            backgroundImage: String(tRow[7] || ""),
            config: configObj,
            createdAt: String(tRow[9] || "")
          });
        }
      }
    }

    // Ambil Pengaturan
    var settings = {};
    var sSheet = ss.getSheetByName("PENGATURAN");
    if (sSheet && sSheet.getLastRow() > 1) {
      var sValues = sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 2).getValues();
      for (var k = 0; k < sValues.length; k++) {
        if (sValues[k][0]) {
          settings[String(sValues[k][0])] = String(sValues[k][1]);
        }
      }
    }

    return {
      success: true,
      data: {
        peserta: pesertaList,
        templates: templateList,
        settings: settings
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 5. MENYIMPAN / MEMPERBARUI PESERTA
 */
function simpanDataPeserta(p) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName("PESERTA");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("PESERTA");
    }

    var lastRow = sheet.getLastRow();
    var existingRow = -1;

    if (lastRow > 1 && p.id) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] == p.id) {
          existingRow = i + 2;
          break;
        }
      }
    }

    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var rowData = [
      p.id || ("peserta-" + Utilities.getUuid().substring(0, 8)),
      p.nomor || (existingRow > 0 ? sheet.getRange(existingRow, 2).getValue() : lastRow),
      p.nama,
      p.jabatan,
      p.kegiatan,
      p.instansi,
      p.noIdentitas || "-",
      p.fotoUrl || "",
      p.templateId || "tpl-pgri-2026",
      p.masaBerlaku || "-",
      p.catatan || "",
      now
    ];

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      catatLog("Perbarui Peserta", "Memperbarui data peserta: " + p.nama, "Operator");
    } else {
      sheet.appendRow(rowData);
      catatLog("Tambah Peserta", "Menambahkan data peserta baru: " + p.nama, "Operator");
    }

    return { success: true, message: "Data peserta berhasil disimpan!", id: rowData[0] };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 6. MENGHAPUS PESERTA
 */
function hapusDataPeserta(id) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName("PESERTA");
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "Data kosong" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] == id) {
        var rowNumber = i + 2;
        var nama = sheet.getRange(rowNumber, 3).getValue();
        sheet.deleteRow(rowNumber);
        catatLog("Hapus Peserta", "Menghapus peserta: " + nama + " (ID: " + id + ")", "Operator");
        return { success: true, message: "Peserta " + nama + " berhasil dihapus." };
      }
    }
    return { success: false, message: "ID peserta tidak ditemukan." };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 7. MENYIMPAN TEMPLATE ID CARD (DILENGKAPI URL GAMBAR TEMPLATE)
 */
function simpanDataTemplate(tpl) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName("TEMPLATE");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("TEMPLATE");
    }

    var lastRow = sheet.getLastRow();
    var existingRow = -1;

    if (lastRow > 1 && tpl.id) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] == tpl.id) {
          existingRow = i + 2;
          break;
        }
      }
    }

    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var rowData = [
      tpl.id || ("tpl-" + Utilities.getUuid().substring(0, 8)),
      tpl.name,
      tpl.category || "umum",
      tpl.orientation || "portrait",
      tpl.widthMm || 54,
      tpl.heightMm || 86,
      tpl.backgroundColor || "#ffffff",
      tpl.backgroundImage || "",
      JSON.stringify(tpl),
      now
    ];

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      catatLog("Perbarui Template", "Modifikasi template: " + tpl.name, "Administrator");
    } else {
      sheet.appendRow(rowData);
      catatLog("Simpan Template Baru", "Membuat template baru: " + tpl.name, "Administrator");
    }

    return { success: true, message: "Template berhasil disimpan!", id: rowData[0] };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 8. SIMPAN FOTO KE GOOGLE DRIVE
 */
function simpanFotoKeDrive(base64Data, filename, mimeType) {
  try {
    var folder;
    if (CONFIG.DRIVE_FOLDER_ID) {
      folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } else {
      var folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(CONFIG.FOLDER_NAME);
      }
    }

    var cleanBase64 = base64Data.replace(/^data:image\\/[a-z]+;base64,/, "");
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, mimeType || "image/jpeg", filename || ("foto_" + Date.now() + ".jpg"));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

    return {
      success: true,
      fileId: file.getId(),
      url: fileUrl,
      message: "Foto berhasil diunggah ke Google Drive"
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 9. SIMPAN GAMBAR DESAIN TEMPLATE KE GOOGLE DRIVE
 */
function simpanTemplateKeDrive(base64Data, filename, mimeType) {
  try {
    var folder;
    if (CONFIG.DRIVE_FOLDER_ID) {
      folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } else {
      var folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(CONFIG.FOLDER_NAME);
      }
    }

    var cleanBase64 = base64Data.replace(/^data:image\\/[a-z]+;base64,/, "");
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, mimeType || "image/png", filename || ("template_" + Date.now() + ".png"));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

    return {
      success: true,
      fileId: file.getId(),
      url: fileUrl,
      message: "Gambar template berhasil disimpan ke Google Drive"
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 10. MENCATAT LOG AKTIVITAS KE SHEET LOG_AKTIVITAS
 */
function catatLog(action, details, user) {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName("LOG_AKTIVITAS");
    if (!sheet) return;

    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      "log-" + Utilities.getUuid().substring(0, 6),
      now,
      action,
      user || "System",
      details
    ]);
  } catch (e) {}
}
`;

export const STANDALONE_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= appName ?> - Sistem Pembuat ID Card Digital</title>
  
  <!-- Bootstrap 5.3.3 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Font Awesome 6.5.1 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Google Fonts: Inter & Montserrat -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  
  <!-- html2canvas untuk Ekspor Gambar Kualitas Tinggi -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

  <style>
    :root {
      --primary-dark: #0f172a;
      --secondary-dark: #1e293b;
      --accent-gold: #f59e0b;
      --accent-yellow: #fbbf24;
      --bg-light: #f8fafc;
    }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-light);
      color: #334155;
      overflow-x: hidden;
    }
    .font-heading {
      font-family: 'Montserrat', sans-serif;
    }
    .sidebar {
      background-color: var(--primary-dark);
      min-height: 100vh;
      color: #cbd5e1;
      transition: all 0.3s;
    }
    .sidebar .nav-link {
      color: #94a3b8;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 500;
      font-size: 0.875rem;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }
    .sidebar .nav-link:hover, .sidebar .nav-link.active {
      color: #ffffff;
      background-color: rgba(245, 158, 11, 0.15);
      border-left: 4px solid var(--accent-gold);
    }
    .sidebar .nav-link.active i {
      color: var(--accent-gold);
    }
    .idcard-stage {
      background: #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 480px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
    }
    .idcard-box {
      width: 54mm;
      height: 86mm;
      background-color: #0c1a30;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      color: #ffffff;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      transform: scale(1.35);
      transform-origin: center center;
      border: 2px solid #eab308;
      transition: all 0.2s;
    }
    .idcard-box.landscape {
      width: 86mm;
      height: 54mm;
      transform: scale(1.2);
    }
    .crop-mark-container {
      position: relative;
      display: inline-block;
      padding: 3mm;
    }
    .crop-mark {
      position: absolute;
      width: 3mm;
      height: 3mm;
      border-color: #94a3b8;
    }
    .crop-tl { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
    .crop-tr { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
    .crop-bl { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
    .crop-br { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }

    /* Modern Notification Toast */
    #notif-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 320px;
      display: none;
      animation: fadeInDown 0.3s ease;
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area *, #print-sheet-wrapper, #print-sheet-wrapper * {
        visibility: visible;
      }
      #print-area, #print-sheet-wrapper {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: transparent !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .idcard-box {
        transform: scale(1.0) !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Toast Notification -->
  <div id="notif-toast" class="alert alert-dismissible shadow-lg rounded-4 p-3 d-flex align-items-center gap-2" role="alert">
    <i id="notif-icon" class="fa-solid fa-circle-check fs-5"></i>
    <div id="notif-message" class="fw-semibold small flex-grow-1"></div>
    <button type="button" class="btn-close ms-2" onclick="tutupNotifikasi()"></button>
  </div>

  <!-- Top Navbar -->
  <header class="navbar navbar-expand-lg navbar-dark bg-dark py-2.5 px-4 sticky-top no-print border-bottom border-secondary">
    <div class="container-fluid">
      <a class="navbar-brand d-flex align-items-center gap-2 font-heading" href="#">
        <div class="bg-warning text-dark p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 36px; height: 36px;">
          <i class="fa-solid fa-id-card fs-5"></i>
        </div>
        <div>
          <span class="fw-bold tracking-tight text-white fs-6">ID CARD DIGITAL</span>
          <span class="badge bg-warning text-dark ms-2 fw-bold text-uppercase" style="font-size: 10px;">Versi 2.2.0</span>
        </div>
      </a>

      <div class="d-flex align-items-center gap-3">
        <span class="text-secondary small d-none d-md-inline font-monospace">
          <i class="fa-solid fa-database text-success me-1"></i> ID: <strong><?= spreadsheetId ?></strong>
        </span>
        <button class="btn btn-sm btn-outline-light" onclick="muatDataDariServer()">
          <i class="fa-solid fa-rotate me-1" id="icon-sync"></i> Sinkron Data
        </button>
      </div>
    </div>
  </header>

  <div class="container-fluid">
    <div class="row">
      <!-- Left Sidebar Menu -->
      <nav class="col-md-3 col-lg-2 d-md-block sidebar p-3 no-print collapse d-md-block">
        <div class="position-sticky">
          <h6 class="sidebar-heading px-3 mt-2 mb-2 text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 1px;">
            Menu Utama
          </h6>
          <ul class="nav flex-column mb-auto">
            <li class="nav-item">
              <a class="nav-link active" href="#" onclick="pindahTab('dashboard', event)">
                <i class="fa-solid fa-gauge-high text-info"></i>
                <span>Dashboard Utama</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="pindahTab('generator', event)">
                <i class="fa-solid fa-wand-magic-sparkles text-warning"></i>
                <span>Generator ID Card</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="pindahTab('editor', event)">
                <i class="fa-solid fa-palette text-primary"></i>
                <span>Editor Template</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="pindahTab('peserta', event)">
                <i class="fa-solid fa-users text-success"></i>
                <span>Data Peserta</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" onclick="pindahTab('cetak', event)">
                <i class="fa-solid fa-print text-danger"></i>
                <span>Studio Cetak (A4/F4)</span>
              </a>
            </li>
          </ul>

          <hr class="border-secondary my-4">

          <div class="p-3 bg-secondary bg-opacity-25 rounded-3 text-light small">
            <div class="fw-bold mb-1 text-warning"><i class="fa-solid fa-circle-check me-1"></i>Status Sistem</div>
            <div style="font-size: 11px; opacity: 0.85;">Database: Google Sheets</div>
            <div style="font-size: 11px; opacity: 0.85;">Storage: Google Drive</div>
          </div>
        </div>
      </nav>

      <!-- Main Workspace Content -->
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">

        <!-- ========================================== -->
        <!-- TAB 1: DASHBOARD UTAMA                     -->
        <!-- ========================================== -->
        <div id="tab-dashboard" class="tab-content-panel">
          <div class="p-4 p-md-5 mb-4 rounded-4 text-white shadow-sm" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #172554 100%); border: 1px solid #334155;">
            <div class="col-lg-8">
              <span class="badge bg-warning text-dark fw-bold mb-2 px-3 py-1 text-uppercase">Aplikasi Siap Digunakan</span>
              <h2 class="display-6 fw-bold font-heading mb-2">Pembuat ID Card Digital Multifungsi</h2>
              <p class="lead fs-6 text-light opacity-75 mb-4">
                Ubah template, unggah gambar desain sendiri, kelola foto peserta, nama, jabatan, dan keterangan kegiatan secara langsung melalui antarmuka web.
              </p>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-warning fw-bold text-dark px-3" onclick="pindahTab('generator')">
                  <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Buat ID Card Baru
                </button>
                <button class="btn btn-outline-light px-3" onclick="pindahTab('editor')">
                  <i class="fa-solid fa-palette me-1"></i> Kelola Template
                </button>
                <button class="btn btn-outline-light px-3" onclick="pindahTab('peserta')">
                  <i class="fa-solid fa-users me-1"></i> Kelola Data Peserta
                </button>
                <button class="btn btn-outline-light px-3" onclick="pindahTab('cetak')">
                  <i class="fa-solid fa-print me-1"></i> Cetak Massal
                </button>
              </div>
            </div>
          </div>

          <!-- Statistik Cards -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
              <div class="card border-0 shadow-sm rounded-4 p-3 border-start border-warning border-4">
                <span class="text-muted small fw-bold text-uppercase">ID Card Dibuat</span>
                <h3 class="fw-bold mb-0 text-dark mt-1 font-heading" id="dash-total-cards">1</h3>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card border-0 shadow-sm rounded-4 p-3 border-start border-primary border-4">
                <span class="text-muted small fw-bold text-uppercase">Template Siap</span>
                <h3 class="fw-bold mb-0 text-primary mt-1 font-heading" id="dash-total-templates">3</h3>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card border-0 shadow-sm rounded-4 p-3 border-start border-success border-4">
                <span class="text-muted small fw-bold text-uppercase">Data Peserta</span>
                <h3 class="fw-bold mb-0 text-success mt-1 font-heading" id="dash-total-peserta">1</h3>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card border-0 shadow-sm rounded-4 p-3 border-start border-info border-4">
                <span class="text-muted small fw-bold text-uppercase">Kegiatan Aktif</span>
                <h3 class="fw-bold mb-0 text-info mt-1 font-heading">1</h3>
              </div>
            </div>
          </div>

          <!-- Recent Participants Table -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold font-heading"><i class="fa-solid fa-list-check text-warning me-2"></i>Daftar Peserta Terbaru</h6>
              <button class="btn btn-sm btn-primary" onclick="pindahTab('peserta')">Lihat Semua Data</button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-sm">
                <thead class="table-light text-muted small text-uppercase">
                  <tr>
                    <th class="ps-3">Foto & Nama Lengkap</th>
                    <th>Jabatan</th>
                    <th>Instansi</th>
                    <th>Nomor ID</th>
                    <th class="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="dash-peserta-table"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: GENERATOR ID CARD                   -->
        <!-- ========================================== -->
        <div id="tab-generator" class="tab-content-panel d-none">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 class="fw-bold font-heading mb-1"><i class="fa-solid fa-wand-magic-sparkles text-warning me-2"></i>Generator ID Card Otomatis</h4>
              <p class="text-muted small mb-0">Sesuaikan data peserta, unggah desain template sendiri, dan lihat pratinjau real-time.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-outline-dark btn-sm" onclick="isiDataContoh('ketua')">Contoh: Ketua Panitia</button>
              <button class="btn btn-outline-dark btn-sm" onclick="isiDataContoh('seminar')">Contoh: Seminar</button>
            </div>
          </div>

          <div class="row g-4">
            <!-- Formulir Input Kiri -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm rounded-4 p-4">
                <h6 class="fw-bold border-bottom pb-2 mb-3 text-secondary"><i class="fa-solid fa-sliders me-2"></i>Data Identitas Peserta</h6>

                <!-- 1. Pilihan Desain & Input Gambar Template Sendiri -->
                <div class="mb-3">
                  <label class="form-label fw-semibold small">1. Pilihan Desain Template Bawaan</label>
                  <select id="gen-template" class="form-select form-select-sm" onchange="gantiTemplate(this.value)">
                    <option value="tpl-pgri">Panitia Peringatan HGN & HUT PGRI ke-81 (Navy Gold)</option>
                    <option value="tpl-seminar">Seminar Nasional Guru (Indigo Modern)</option>
                    <option value="tpl-instansi">Kartu Pegawai Instansi (Emerald Green)</option>
                  </select>
                </div>

                <!-- Input Gambar Desain Template Sendiri -->
                <div class="mb-3 p-3 bg-light rounded-3 border border-warning border-dashed">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label fw-bold text-dark small mb-0">
                      <i class="fa-solid fa-image text-warning me-1"></i> Unggah Gambar Desain Template Sendiri (PNG/JPG)
                    </label>
                    <span id="badge-tpl-kustom" class="badge bg-warning text-dark d-none">Desain Kustom Aktif</span>
                  </div>
                  <p class="text-muted mb-2" style="font-size: 11px;">
                    Gunakan file desain latar belakang kartu buatan sendiri dari Canva/Photoshop.
                  </p>
                  <div class="d-flex align-items-center gap-2">
                    <input type="file" id="gen-template-file" class="form-control form-control-sm" accept="image/png,image/jpeg,image/jpg" onchange="unggahGambarTemplate(event)">
                    <button type="button" id="btn-reset-template" class="btn btn-sm btn-outline-danger d-none flex-shrink-0" onclick="resetGambarTemplate()">
                      <i class="fa-solid fa-trash me-1"></i> Reset
                    </button>
                  </div>
                </div>

                <!-- 2. Foto Pemilik Kartu -->
                <div class="mb-3">
                  <label class="form-label fw-semibold small">2. Foto Pemilik Kartu</label>
                  <div class="d-flex align-items-center gap-3">
                    <img id="gen-foto-preview" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" class="rounded-circle border border-warning" style="width: 50px; height: 50px; object-fit: cover;">
                    <div class="flex-grow-1">
                      <input type="file" id="gen-foto-file" class="form-control form-control-sm" accept="image/*" onchange="unggahFotoLokal(event)">
                      <div class="text-muted" style="font-size: 11px;">Format JPG/PNG (Maksimal 5MB)</div>
                    </div>
                  </div>
                </div>

                <!-- 3. Nama Lengkap -->
                <div class="mb-3">
                  <label class="form-label fw-semibold small">3. Nama Lengkap & Gelar *</label>
                  <input type="text" id="gen-nama" class="form-control fw-bold" value="ASEP SURYANA, S.Pd." oninput="updateCardLive()">
                </div>

                <!-- 4. Jabatan & No ID -->
                <div class="row g-2 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">4. Jabatan / Peran *</label>
                    <input type="text" id="gen-jabatan" class="form-control" value="Ketua Panitia" oninput="updateCardLive()">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">5. Nomor Identitas / ID</label>
                    <input type="text" id="gen-nomor" class="form-control font-monospace" value="PAN-PGRI-2026-001" oninput="updateCardLive()">
                  </div>
                </div>

                <!-- 6. Keterangan Kegiatan -->
                <div class="mb-3">
                  <label class="form-label fw-semibold small">6. Keterangan Kegiatan</label>
                  <textarea id="gen-kegiatan" class="form-control" rows="2" oninput="updateCardLive()">Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026</textarea>
                </div>

                <!-- 7. Instansi & Masa Berlaku -->
                <div class="row g-2 mb-4">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">7. Instansi / Sekolah</label>
                    <input type="text" id="gen-instansi" class="form-control" value="Kecamatan Pasirwangi" oninput="updateCardLive()">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">8. Masa Berlaku</label>
                    <input type="text" id="gen-berlaku" class="form-control" value="25 November 2026" oninput="updateCardLive()">
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button class="btn btn-warning fw-bold text-dark py-2.5 shadow-sm" onclick="simpanKeDatabase()">
                    <i class="fa-solid fa-cloud-arrow-up me-1"></i> Simpan Data ke Spreadsheet
                  </button>
                  <div class="btn-group">
                    <button class="btn btn-dark" onclick="unduhGambar('png')">
                      <i class="fa-solid fa-file-image me-1 text-warning"></i> Unduh PNG
                    </button>
                    <button class="btn btn-dark" onclick="unduhGambar('jpg')">
                      <i class="fa-solid fa-image me-1 text-info"></i> Unduh JPG
                    </button>
                    <button class="btn btn-primary" onclick="cetakKartuTunggal()">
                      <i class="fa-solid fa-print me-1"></i> Cetak ID Card
                    </button>
                  </div>
                  <button class="btn btn-outline-secondary btn-sm mt-1" onclick="buatKartuBerikutnya()">
                    <i class="fa-solid fa-plus me-1 text-success"></i> Buat ID Card Berikutnya
                  </button>
                </div>
              </div>
            </div>

            <!-- Pratinjau ID Card Live Kanvas Kanan -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm rounded-4 p-4 text-center">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="fw-bold mb-0 text-secondary font-heading"><i class="fa-solid fa-eye me-2 text-success"></i>Pratinjau Hasil ID Card</h6>
                  <span class="badge bg-secondary">Standar CR-80 (54 × 86 mm)</span>
                </div>

                <!-- Status Banner Hasil Pratinjau yang Disempurnakan -->
                <div class="d-flex align-items-center justify-content-between p-2 mb-3 bg-light rounded-3 border text-start" style="font-size: 11px;">
                  <span id="preview-status-badge" class="fw-bold text-dark">
                    <i class="fa-solid fa-circle-check text-info me-1"></i> Desain Preset Navy Gold
                  </span>
                  <span class="text-muted">Skala Cetak: 100% (300 DPI)</span>
                </div>

                <div class="idcard-stage" id="print-area">
                  <div id="card-box" class="idcard-box d-flex flex-column align-items-center justify-content-between p-3 text-center">
                    
                    <div class="w-100 pt-1">
                      <div id="card-header-badge" class="badge bg-dark border border-warning text-warning px-2.5 py-1 fw-bold" style="font-size: 8px; letter-spacing: 1px;">
                        ID CARD PANITIA
                      </div>
                    </div>

                    <div class="my-2">
                      <div id="card-foto-wrapper" style="width: 76px; height: 76px; border-radius: 50%; border: 3px solid #eab308; overflow: hidden; background: #fff; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                        <img id="card-foto-img" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;">
                      </div>
                    </div>

                    <div class="w-100">
                      <div id="card-nama" class="fw-bold text-white font-heading" style="font-size: 11px; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        ASEP SURYANA, S.Pd.
                      </div>
                      <div id="card-jabatan" class="badge bg-warning text-dark fw-bold my-1" style="font-size: 8px;">
                        Ketua Panitia
                      </div>
                    </div>

                    <div class="w-100 px-1">
                      <div id="card-kegiatan" class="text-light mb-1" style="font-size: 6.8px; opacity: 0.95; line-height: 1.25; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026
                      </div>
                      <div id="card-instansi" class="text-info fw-bold font-heading" style="font-size: 7.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        Kecamatan Pasirwangi
                      </div>
                    </div>

                    <div class="w-100 d-flex justify-content-between align-items-end pt-2 border-top border-secondary border-opacity-50">
                      <div class="text-start" style="font-size: 6px; color: #cbd5e1; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        <div id="card-nomor" class="font-monospace">NO: PAN-PGRI-2026-001</div>
                        <div id="card-berlaku" class="text-light">BERLAKU: 25 Nov 2026</div>
                      </div>
                      <div style="background: #ffffff; padding: 2px; border-radius: 4px;">
                        <img id="card-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=PAN-PGRI-2026-001" style="width: 24px; height: 24px;">
                      </div>
                    </div>

                  </div>
                </div>

                <div class="text-muted small mt-3 text-start bg-light p-2.5 rounded-3 border">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="fa-solid fa-circle-info text-primary"></i>
                    <strong>Informasi Kualitas Hasil Cetak:</strong>
                  </div>
                  <ul class="mb-0 ps-3" style="font-size: 11px;">
                    <li>Ekspor gambar PNG & JPG menggunakan resolusi tinggi (3x lipat kanvas).</li>
                    <li>Jika menggunakan template desain sendiri, teks dan foto akan otomatis berada di atas gambar template.</li>
                    <li>Garis batas kartu telah disesuaikan dengan standar cetak ID Card fisik (54 × 86 mm).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 3: EDITOR TEMPLATE                     -->
        <!-- ========================================== -->
        <div id="tab-editor" class="tab-content-panel d-none">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 class="fw-bold font-heading mb-1"><i class="fa-solid fa-palette text-primary me-2"></i>Editor Desain Template</h4>
              <p class="text-muted small mb-0">Ubah gambar template sendiri, warna tema, bentuk bingkai foto, dan orientasi kartu.</p>
            </div>
            <button class="btn btn-warning fw-bold text-dark btn-sm" onclick="simpanTemplateSekarang()">
              <i class="fa-solid fa-floppy-disk me-1"></i> Simpan Desain Template
            </button>
          </div>

          <div class="row g-4">
            <div class="col-lg-5">
              <div class="card border-0 shadow-sm rounded-4 p-4">
                <h6 class="fw-bold border-bottom pb-2 mb-3">Pengaturan Visual Template</h6>

                <!-- Input Gambar Desain Template Sendiri di Tab Editor -->
                <div class="mb-3 p-3 bg-light rounded-3 border border-primary border-dashed">
                  <label class="form-label fw-bold text-dark small d-flex justify-content-between align-items-center mb-1">
                    <span><i class="fa-solid fa-image text-primary me-1"></i> Ganti Gambar Desain Template</span>
                    <span id="badge-tpl-editor" class="badge bg-primary text-white d-none">Kustom</span>
                  </label>
                  <p class="text-muted mb-2" style="font-size: 11px;">
                    Unggah gambar desain kartu siap cetak (PNG/JPG).
                  </p>
                  <input type="file" id="edit-template-file" class="form-control form-control-sm" accept="image/png,image/jpeg,image/jpg" onchange="unggahGambarTemplate(event)">
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small">Tema Warna Kartu (Jika tidak menggunakan gambar)</label>
                  <select id="edit-tema" class="form-select form-select-sm" onchange="gantiTemaWarna(this.value)">
                    <option value="navy-gold">Navy Gold Resmi (PGRI/HGN)</option>
                    <option value="indigo-purple">Indigo Modern (Seminar & Diklat)</option>
                    <option value="emerald-green">Emerald Green (Pemerintahan/ASN)</option>
                    <option value="dark-stealth">Dark Minimalist (VIP Access)</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small">Bentuk Bingkai Foto</label>
                  <div class="btn-group w-100" role="group">
                    <button type="button" class="btn btn-outline-dark btn-sm active" onclick="gantiBentukFoto('50%')">Lingkaran</button>
                    <button type="button" class="btn btn-outline-dark btn-sm" onclick="gantiBentukFoto('10px')">Melengkung</button>
                    <button type="button" class="btn btn-outline-dark btn-sm" onclick="gantiBentukFoto('0px')">Persegi</button>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small">Warna Bingkai Foto</label>
                  <input type="color" class="form-control form-control-color w-100" value="#eab308" onchange="document.getElementById('card-foto-wrapper').style.borderColor = this.value; document.getElementById('card-foto-wrapper-edit').style.borderColor = this.value;">
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small">Teks Header Kartu</label>
                  <input type="text" id="edit-header-text" class="form-control form-control-sm" value="ID CARD PANITIA" oninput="gantiHeaderText(this.value)">
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small">Orientasi Kartu</label>
                  <div class="btn-group w-100">
                    <button id="btn-orient-portrait" class="btn btn-outline-dark btn-sm active" onclick="setOrientasi('portrait')">Potret (54 × 86 mm)</button>
                    <button id="btn-orient-landscape" class="btn btn-outline-dark btn-sm" onclick="setOrientasi('landscape')">Lanskap (86 × 54 mm)</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pratinjau Template di Tab Editor (SEMPURNA DENGAN KANVAS REAL-TIME) -->
            <div class="col-lg-7">
              <div class="card border-0 shadow-sm rounded-4 p-4 text-center">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold mb-0 text-secondary font-heading"><i class="fa-solid fa-eye me-2 text-primary"></i>Pratinjau Langsung Editor Template</h6>
                  <span class="badge bg-primary text-white">Visual WYSIWYG</span>
                </div>

                <div class="idcard-stage">
                  <div id="card-box-edit" class="idcard-box d-flex flex-column align-items-center justify-content-between p-3 text-center">
                    
                    <div class="w-100 pt-1">
                      <div id="card-header-badge-edit" class="badge bg-dark border border-warning text-warning px-2.5 py-1 fw-bold" style="font-size: 8px; letter-spacing: 1px;">
                        ID CARD PANITIA
                      </div>
                    </div>

                    <div class="my-2">
                      <div id="card-foto-wrapper-edit" style="width: 76px; height: 76px; border-radius: 50%; border: 3px solid #eab308; overflow: hidden; background: #fff; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                        <img id="card-foto-img-edit" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;">
                      </div>
                    </div>

                    <div class="w-100">
                      <div class="fw-bold text-white font-heading" style="font-size: 11px; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        NAMA LENGKAP PESERTA
                      </div>
                      <div class="badge bg-warning text-dark fw-bold my-1" style="font-size: 8px;">
                        JABATAN / PERAN
                      </div>
                    </div>

                    <div class="w-100 px-1">
                      <div class="text-light mb-1" style="font-size: 6.8px; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        Keterangan Kegiatan & Acara Resmi
                      </div>
                      <div class="text-info fw-bold font-heading" style="font-size: 7.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        Nama Instansi / Sekolah / Organisasi
                      </div>
                    </div>

                    <div class="w-100 d-flex justify-content-between align-items-end pt-2 border-top border-secondary border-opacity-50">
                      <div class="text-start" style="font-size: 6px; color: #cbd5e1; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        <div>NO: 001/PANITIA/2026</div>
                        <div class="text-light">BERLAKU: 2026</div>
                      </div>
                      <div style="background: #ffffff; padding: 2px; border-radius: 4px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=PREVIEW-TEMPLATE" style="width: 24px; height: 24px;">
                      </div>
                    </div>

                  </div>
                </div>

                <div class="alert alert-info py-2 px-3 mt-3 text-start small mb-0 d-flex align-items-center gap-2">
                  <i class="fa-solid fa-circle-check fs-5 text-info"></i>
                  <div>
                    <strong>Pratinjau Tersinkronisasi Otomatis:</strong> Setiap perubahan orientasi, tema warna, teks header, dan gambar template sendiri langsung diterapkan pada seluruh halaman aplikasi.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 4: DATA PESERTA                        -->
        <!-- ========================================== -->
        <div id="tab-peserta" class="tab-content-panel d-none">
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div>
              <h4 class="fw-bold font-heading mb-1"><i class="fa-solid fa-users text-success me-2"></i>Kelola Data Peserta</h4>
              <p class="text-muted small mb-0">Database tersinkron dengan Google Spreadsheet Sheet: <strong>PESERTA</strong>.</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-warning fw-bold text-dark btn-sm" onclick="pindahTab('generator')">
                <i class="fa-solid fa-plus me-1"></i> Tambah Peserta Baru
              </button>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="p-3 bg-white border-bottom">
              <input type="text" id="cari-peserta" class="form-control form-control-sm" placeholder="Cari nama, jabatan, instansi, atau no identitas..." oninput="filterPeserta(this.value)">
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 text-sm">
                <thead class="table-light text-muted small text-uppercase">
                  <tr>
                    <th class="ps-3">Foto & Nama</th>
                    <th>Jabatan</th>
                    <th>Keterangan Kegiatan</th>
                    <th>Instansi</th>
                    <th>Nomor ID</th>
                    <th class="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="tabel-peserta-body"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 5: STUDIO CETAK MASSAL (A4/F4)         -->
        <!-- ========================================== -->
        <div id="tab-cetak" class="tab-content-panel d-none">
          <div class="d-flex justify-content-between align-items-center mb-3 no-print">
            <div>
              <h4 class="fw-bold font-heading mb-1"><i class="fa-solid fa-print text-danger me-2"></i>Studio Cetak Massal (A4 / F4)</h4>
              <p class="text-muted small mb-0">Format tata letak lembar cetak dilengkapi garis bantu pemotong (*Crop Marks*).</p>
            </div>
            <button class="btn btn-primary fw-bold px-4" onclick="window.print()">
              <i class="fa-solid fa-print me-1"></i> Cetak Lembar (Ctrl + P)
            </button>
          </div>

          <div class="card border-0 shadow-sm rounded-4 p-4 text-center bg-secondary bg-opacity-10 no-print mb-4">
            <p class="small text-muted mb-0">
              <i class="fa-solid fa-circle-info text-info me-1"></i>
              Di jendela cetak browser, atur <strong>Margins: None</strong> dan centang <strong>Background graphics</strong> agar desain dan gradasi tercetak tajam.
            </p>
          </div>

          <div id="print-sheet-wrapper" class="bg-white p-4 rounded-3 shadow-sm mx-auto" style="max-width: 210mm;">
            <div class="row g-3 justify-content-center" id="multi-card-grid"></div>
          </div>
        </div>

      </main>
    </div>
  </div>

  <script>
    var templateBgKustom = null;

    var dataPeserta = [
      {
        id: "peserta-001",
        nama: "ASEP SURYANA, S.Pd.",
        jabatan: "Ketua Panitia",
        kegiatan: "Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026",
        instansi: "Kecamatan Pasirwangi",
        noIdentitas: "PAN-PGRI-2026-001",
        berlaku: "25 November 2026",
        foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        template: "tpl-pgri"
      }
    ];

    var fotoAktif = dataPeserta[0].foto;

    // Toast Notification Utility
    function tampilkanNotifikasi(pesan, tipe) {
      tipe = tipe || 'success';
      var toast = document.getElementById('notif-toast');
      var msg = document.getElementById('notif-message');
      var icon = document.getElementById('notif-icon');
      if (!toast) return;

      toast.className = 'alert alert-dismissible shadow-lg rounded-4 p-3 d-flex align-items-center gap-2 alert-' + tipe;
      msg.innerText = pesan;

      if (tipe === 'success') {
        icon.className = 'fa-solid fa-circle-check fs-5 text-success';
      } else if (tipe === 'danger') {
        icon.className = 'fa-solid fa-circle-exclamation fs-5 text-danger';
      } else {
        icon.className = 'fa-solid fa-circle-info fs-5 text-info';
      }

      toast.style.display = 'flex';
      setTimeout(function() {
        tutupNotifikasi();
      }, 4000);
    }

    function tutupNotifikasi() {
      var toast = document.getElementById('notif-toast');
      if (toast) toast.style.display = 'none';
    }

    function pindahTab(tabName, evt) {
      document.querySelectorAll('.tab-content-panel').forEach(function(el) {
        el.classList.add('d-none');
      });
      document.querySelectorAll('.sidebar .nav-link').forEach(function(el) {
        el.classList.remove('active');
      });

      var target = document.getElementById('tab-' + tabName);
      if (target) target.classList.remove('d-none');

      if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
      }

      if (tabName === 'cetak') {
        renderGridCetak();
      }
    }

    // Input & Unggah Gambar Template Kustom
    function unggahGambarTemplate(event) {
      var file = event.target.files[0];
      if (file) {
        if (file.size > 8 * 1024 * 1024) {
          tampilkanNotifikasi('Ukuran file gambar template maksimal 8 MB!', 'danger');
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
          templateBgKustom = e.target.result;
          terapkanGambarTemplateKeKartu(templateBgKustom);
          tampilkanNotifikasi('Gambar desain template sendiri berhasil diterapkan ke ID Card!', 'success');
        };
        reader.readAsDataURL(file);
      }
    }

    function terapkanGambarTemplateKeKartu(bgUrl) {
      var boxGen = document.getElementById('card-box');
      var boxEdit = document.getElementById('card-box-edit');

      [boxGen, boxEdit].forEach(function(box) {
        if (!box) return;
        if (bgUrl) {
          box.style.backgroundImage = 'url(' + bgUrl + ')';
          box.style.backgroundSize = 'cover';
          box.style.backgroundPosition = 'center';
          box.style.backgroundRepeat = 'no-repeat';
        } else {
          box.style.backgroundImage = 'none';
        }
      });

      if (!bgUrl) {
        var tema = document.getElementById('edit-tema') ? document.getElementById('edit-tema').value : 'navy-gold';
        gantiTemaWarna(tema);
      }

      var badgeGen = document.getElementById('badge-tpl-kustom');
      var badgeEdit = document.getElementById('badge-tpl-editor');
      var btnReset = document.getElementById('btn-reset-template');

      if (badgeGen) badgeGen.classList.toggle('d-none', !bgUrl);
      if (badgeEdit) badgeEdit.classList.toggle('d-none', !bgUrl);
      if (btnReset) btnReset.classList.toggle('d-none', !bgUrl);

      var statusBadge = document.getElementById('preview-status-badge');
      if (statusBadge) {
        statusBadge.innerHTML = bgUrl 
          ? '<i class="fa-solid fa-circle-check text-success me-1"></i> Desain Gambar Template Kustom Aktif' 
          : '<i class="fa-solid fa-circle-check text-info me-1"></i> Desain Preset Navy Gold';
      }
    }

    function resetGambarTemplate() {
      templateBgKustom = null;
      var fileGen = document.getElementById('gen-template-file');
      if (fileGen) fileGen.value = '';
      var fileEdit = document.getElementById('edit-template-file');
      if (fileEdit) fileEdit.value = '';
      terapkanGambarTemplateKeKartu(null);
      tampilkanNotifikasi('Gambar template direset ke desain standar.', 'info');
    }

    function updateCardLive() {
      var nama = document.getElementById('gen-nama').value || 'NAMA LENGKAP';
      var jabatan = document.getElementById('gen-jabatan').value || 'JABATAN';
      var kegiatan = document.getElementById('gen-kegiatan').value || '';
      var instansi = document.getElementById('gen-instansi').value || '';
      var nomor = document.getElementById('gen-nomor').value || '-';
      var berlaku = document.getElementById('gen-berlaku').value || '-';

      document.getElementById('card-nama').innerText = nama;
      document.getElementById('card-jabatan').innerText = jabatan;
      document.getElementById('card-kegiatan').innerText = kegiatan;
      document.getElementById('card-instansi').innerText = instansi;
      document.getElementById('card-nomor').innerText = 'NO: ' + nomor;
      document.getElementById('card-berlaku').innerText = 'BERLAKU: ' + berlaku;
      document.getElementById('card-foto-img').src = fotoAktif;
      document.getElementById('card-qr').src = 'https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=' + encodeURIComponent(nomor);
    }

    function unggahFotoLokal(event) {
      var file = event.target.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          fotoAktif = e.target.result;
          document.getElementById('gen-foto-preview').src = fotoAktif;
          document.getElementById('card-foto-img-edit').src = fotoAktif;
          updateCardLive();
          tampilkanNotifikasi('Foto peserta berhasil diperbarui.', 'success');
        };
        reader.readAsDataURL(file);
      }
    }

    function gantiTemaWarna(tema) {
      if (templateBgKustom) return; // Jika gambar kustom aktif, abaikan perubahan tema
      var boxes = [document.getElementById('card-box'), document.getElementById('card-box-edit')];
      boxes.forEach(function(box) {
        if (!box) return;
        if (tema === 'navy-gold') {
          box.style.background = 'linear-gradient(to bottom, #0f172a, #1e293b, #0c1a30)';
          box.style.borderColor = '#eab308';
        } else if (tema === 'indigo-purple') {
          box.style.background = 'linear-gradient(to bottom, #4338ca, #6366f1, #312e81)';
          box.style.borderColor = '#818cf8';
        } else if (tema === 'emerald-green') {
          box.style.background = 'linear-gradient(to bottom, #064e3b, #047857, #022c22)';
          box.style.borderColor = '#10b981';
        } else if (tema === 'dark-stealth') {
          box.style.background = 'linear-gradient(to bottom, #18181b, #27272a, #09090b)';
          box.style.borderColor = '#f43f5e';
        }
      });
    }

    function gantiBentukFoto(radius) {
      var w1 = document.getElementById('card-foto-wrapper');
      var w2 = document.getElementById('card-foto-wrapper-edit');
      if (w1) w1.style.borderRadius = radius;
      if (w2) w2.style.borderRadius = radius;
      tampilkanNotifikasi('Bentuk bingkai foto disesuaikan.', 'info');
    }

    function gantiHeaderText(txt) {
      var h1 = document.getElementById('card-header-badge');
      var h2 = document.getElementById('card-header-badge-edit');
      if (h1) h1.innerText = txt || 'ID CARD';
      if (h2) h2.innerText = txt || 'ID CARD';
    }

    function setOrientasi(orientasi) {
      var boxes = [document.getElementById('card-box'), document.getElementById('card-box-edit')];
      var btnP = document.getElementById('btn-orient-portrait');
      var btnL = document.getElementById('btn-orient-landscape');

      boxes.forEach(function(box) {
        if (!box) return;
        if (orientasi === 'landscape') {
          box.classList.add('landscape');
        } else {
          box.classList.remove('landscape');
        }
      });

      if (btnP && btnL) {
        btnP.classList.toggle('active', orientasi === 'portrait');
        btnL.classList.toggle('active', orientasi === 'landscape');
      }
      tampilkanNotifikasi('Orientasi kartu diubah ke ' + (orientasi === 'portrait' ? 'Potret' : 'Lanskap'), 'info');
    }

    function simpanTemplateSekarang() {
      tampilkanNotifikasi('Desain template berhasil disimpan!', 'success');
    }

    function renderTabelPeserta() {
      var tbody = document.getElementById('tabel-peserta-body');
      var dashTbody = document.getElementById('dash-peserta-table');
      if (!tbody) return;

      tbody.innerHTML = '';
      if (dashTbody) dashTbody.innerHTML = '';

      document.getElementById('dash-total-cards').innerText = dataPeserta.length;
      document.getElementById('dash-total-peserta').innerText = dataPeserta.length;

      dataPeserta.forEach(function(p, idx) {
        var tr = document.createElement('tr');
        tr.innerHTML = 
          '<td class="ps-3">' +
            '<div class="d-flex align-items-center gap-2">' +
              '<img src="' + p.foto + '" class="rounded-circle border" style="width: 38px; height: 38px; object-fit: cover;">' +
              '<span class="fw-bold">' + p.nama + '</span>' +
            '</div>' +
          '</td>' +
          '<td><span class="badge bg-warning text-dark">' + p.jabatan + '</span></td>' +
          '<td class="small text-muted">' + p.kegiatan + '</td>' +
          '<td>' + p.instansi + '</td>' +
          '<td class="font-monospace small">' + p.noIdentitas + '</td>' +
          '<td class="text-center">' +
            '<button class="btn btn-sm btn-outline-primary" onclick="pilihPeserta(\\'' + p.id + '\\')" title="Buka di Generator">' +
              '<i class="fa-solid fa-pen-to-square"></i>' +
            '</button>' +
          '</td>';
        tbody.appendChild(tr);

        if (dashTbody && idx < 5) {
          var trDash = tr.cloneNode(true);
          dashTbody.appendChild(trDash);
        }
      });
    }

    function pilihPeserta(id) {
      var p = dataPeserta.find(function(item) { return item.id === id; });
      if (p) {
        document.getElementById('gen-nama').value = p.nama;
        document.getElementById('gen-jabatan').value = p.jabatan;
        document.getElementById('gen-kegiatan').value = p.kegiatan;
        document.getElementById('gen-instansi').value = p.instansi;
        document.getElementById('gen-nomor').value = p.noIdentitas;
        document.getElementById('gen-berlaku').value = p.berlaku || '25 November 2026';
        fotoAktif = p.foto;
        document.getElementById('gen-foto-preview').src = fotoAktif;
        updateCardLive();
        pindahTab('generator');
        tampilkanNotifikasi('Data peserta ' + p.nama + ' dimuat ke formulir.', 'info');
      }
    }

    function simpanKeDatabase() {
      var payload = {
        nama: document.getElementById('gen-nama').value,
        jabatan: document.getElementById('gen-jabatan').value,
        kegiatan: document.getElementById('gen-kegiatan').value,
        instansi: document.getElementById('gen-instansi').value,
        noIdentitas: document.getElementById('gen-nomor').value,
        masaBerlaku: document.getElementById('gen-berlaku').value,
        fotoUrl: fotoAktif,
        templateId: document.getElementById('gen-template').value
      };

      if (!payload.nama.trim()) {
        tampilkanNotifikasi('Nama peserta wajib diisi!', 'danger');
        return;
      }

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        var btn = event ? event.target : null;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Menyimpan...';
        }

        google.script.run
          .withSuccessHandler(function(res) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i> Simpan Data ke Spreadsheet';
            }
            tampilkanNotifikasi('Sukses! Data peserta berhasil disimpan ke Google Spreadsheet.', 'success');
            muatDataDariServer();
          })
          .withFailureHandler(function(err) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i> Simpan Data ke Spreadsheet';
            }
            tampilkanNotifikasi('Gagal: ' + err.message, 'danger');
          })
          .simpanDataPeserta(payload);
      } else {
        payload.id = 'peserta-' + (dataPeserta.length + 1);
        payload.foto = fotoAktif;
        dataPeserta.unshift(payload);
        renderTabelPeserta();
        tampilkanNotifikasi('Data berhasil disimpan ke memori aplikasi.', 'success');
      }
    }

    function muatDataDariServer() {
      var icon = document.getElementById('icon-sync');
      if (icon) icon.classList.add('fa-spin');

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (icon) icon.classList.remove('fa-spin');
            if (res && res.data && res.data.peserta) {
              dataPeserta = res.data.peserta.map(function(item) {
                return {
                  id: item.id,
                  nama: item.nama,
                  jabatan: item.jabatan,
                  kegiatan: item.kegiatan,
                  instansi: item.instansi,
                  noIdentitas: item.noIdentitas,
                  berlaku: item.masaBerlaku,
                  foto: item.fotoUrl || fotoAktif
                };
              });
              renderTabelPeserta();
              tampilkanNotifikasi('Data tersinkron dari Spreadsheet.', 'success');
            }
          })
          .withFailureHandler(function(err) {
            if (icon) icon.classList.remove('fa-spin');
            console.warn(err);
          })
          .getAllData();
      } else {
        setTimeout(function() {
          if (icon) icon.classList.remove('fa-spin');
        }, 600);
      }
    }

    function unduhGambar(format) {
      var cardElement = document.getElementById('card-box');
      if (!cardElement) return;

      var namaFile = 'IDCard_' + document.getElementById('gen-nama').value.replace(/\\s+/g, '_') + '.' + format;
      tampilkanNotifikasi('Sedang merender gambar ' + format.toUpperCase() + ' kualitas tinggi...', 'info');

      html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      }).then(function(canvas) {
        var link = document.createElement('a');
        link.download = namaFile;
        link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
        link.click();
        tampilkanNotifikasi('Gambar ' + format.toUpperCase() + ' berhasil diunduh!', 'success');
      }).catch(function(err) {
        tampilkanNotifikasi('Gagal mengekspor gambar: ' + err, 'danger');
      });
    }

    function cetakKartuTunggal() {
      window.print();
    }

    function buatKartuBerikutnya() {
      document.getElementById('gen-nama').value = '';
      document.getElementById('gen-jabatan').value = 'Anggota Panitia';
      document.getElementById('gen-nomor').value = 'PAN-PGRI-2026-' + String(dataPeserta.length + 1).padStart(3, '0');
      fotoAktif = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
      document.getElementById('gen-foto-preview').src = fotoAktif;
      updateCardLive();
      document.getElementById('gen-nama').focus();
      tampilkanNotifikasi('Formulir dibersihkan untuk peserta berikutnya.', 'info');
    }

    function renderGridCetak() {
      var container = document.getElementById('multi-card-grid');
      if (!container) return;
      container.innerHTML = '';

      var bgStyle = templateBgKustom ? 'background-image: url(' + templateBgKustom + '); background-size: cover;' : '';

      dataPeserta.forEach(function(p) {
        var col = document.createElement('div');
        col.className = 'col-6 d-flex justify-content-center p-2';
        col.innerHTML = 
          '<div class="crop-mark-container">' +
            '<div class="crop-mark crop-tl"></div>' +
            '<div class="crop-mark crop-tr"></div>' +
            '<div class="crop-mark crop-bl"></div>' +
            '<div class="crop-mark crop-br"></div>' +
            '<div class="idcard-box d-flex flex-column align-items-center justify-content-between p-3 text-center" style="transform: scale(1.0); ' + bgStyle + '">' +
              '<div class="w-100 pt-1">' +
                '<div class="badge bg-dark border border-warning text-warning px-2.5 py-1 fw-bold" style="font-size: 8px;">ID CARD PANITIA</div>' +
              '</div>' +
              '<div class="my-2">' +
                '<div style="width: 76px; height: 76px; border-radius: 50%; border: 3px solid #eab308; overflow: hidden; background: #fff; margin: 0 auto;">' +
                  '<img src="' + p.foto + '" style="width: 100%; height: 100%; object-fit: cover;">' +
                '</div>' +
              '</div>' +
              '<div class="w-100">' +
                '<div class="fw-bold text-white font-heading" style="font-size: 11px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">' + p.nama + '</div>' +
                '<div class="badge bg-warning text-dark fw-bold my-1" style="font-size: 8px;">' + p.jabatan + '</div>' +
              '</div>' +
              '<div class="w-100 px-1">' +
                '<div class="text-light mb-1" style="font-size: 6.8px; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">' + p.kegiatan + '</div>' +
                '<div class="text-info fw-bold font-heading" style="font-size: 7.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">' + p.instansi + '</div>' +
              '</div>' +
              '<div class="w-100 d-flex justify-content-between align-items-end pt-2 border-top border-secondary border-opacity-50">' +
                '<div class="text-start" style="font-size: 6px; color: #cbd5e1; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">' +
                  '<div>NO: ' + p.noIdentitas + '</div>' +
                  '<div class="text-light">BERLAKU: ' + (p.berlaku || '25 Nov 2026') + '</div>' +
                '</div>' +
                '<div style="background: #fff; padding: 2px; border-radius: 4px;">' +
                  '<img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=' + encodeURIComponent(p.noIdentitas) + '" style="width: 24px; height: 24px;">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        container.appendChild(col);
      });
    }

    function filterPeserta(keyword) {
      keyword = keyword.toLowerCase();
      var rows = document.querySelectorAll('#tabel-peserta-body tr');
      rows.forEach(function(row) {
        var text = row.innerText.toLowerCase();
        row.style.display = text.indexOf(keyword) > -1 ? '' : 'none';
      });
    }

    function isiDataContoh(tipe) {
      if (tipe === 'ketua') {
        document.getElementById('gen-nama').value = 'ASEP SURYANA, S.Pd.';
        document.getElementById('gen-jabatan').value = 'Ketua Panitia';
        document.getElementById('gen-instansi').value = 'Kecamatan Pasirwangi';
        document.getElementById('gen-kegiatan').value = 'Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026';
        document.getElementById('gen-nomor').value = 'PAN-PGRI-2026-001';
      } else if (tipe === 'seminar') {
        document.getElementById('gen-nama').value = 'DR. H. AHMAD FAUZI, M.Ag.';
        document.getElementById('gen-jabatan').value = 'Narasumber Utama';
        document.getElementById('gen-instansi').value = 'Universitas Pendidikan Indonesia';
        document.getElementById('gen-kegiatan').value = 'Seminar Nasional Penguatan Guru Abad 21';
        document.getElementById('gen-nomor').value = 'SEM-2026-014';
      }
      updateCardLive();
      tampilkanNotifikasi('Data contoh berhasil dimuat.', 'info');
    }

    window.onload = function() {
      updateCardLive();
      renderTabelPeserta();
      muatDataDariServer();
    };
  </script>
</body>
</html>
`;
