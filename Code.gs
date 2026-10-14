/**
 * ============================================================================
 * APLIKASI PEMBUAT ID CARD DIGITAL MULTIFUNGSI (VERSI TERBARU 2.2.0)
 * Backend: Google Apps Script (Code.gs)
 * Database: Google Spreadsheet (ID: 1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU)
 * Storage Foto & Desain Template: Google Drive
 * ============================================================================
 */

// KONFIGURASI UTAMA
var CONFIG = {
  SPREADSHEET_ID: "1GHc5PE9pPZjakJ3sm329L1GXpqv9ranewFdcOWRmGzU", // Google Spreadsheet ID
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

    var cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
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

    var cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
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
