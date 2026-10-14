export type Orientation = 'portrait' | 'landscape';
export type PhotoShape = 'circle' | 'square' | 'rounded';
export type TextAlign = 'center' | 'left' | 'right';

export interface ElementStyle {
  visible: boolean;
  x: number; // percentage (0-100) or mm
  y: number; // percentage (0-100) or mm
  fontSize: number; // pt or px
  fontWeight: 'normal' | '500' | '600' | 'bold' | '800';
  color: string;
  align: TextAlign;
  fontFamily: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface HeaderElementStyle extends ElementStyle {
  text: string;
  isBadge?: boolean;
  badgeBg?: string;
}

export interface PhotoElementStyle {
  visible: boolean;
  x: number;
  y: number;
  width: number; // mm
  height: number; // mm
  shape: PhotoShape;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  objectFit: 'cover' | 'contain';
}

export interface LogoElementStyle {
  visible: boolean;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QrElementStyle {
  visible: boolean;
  x: number;
  y: number;
  size: number;
  payloadType: 'id' | 'url' | 'vcard' | 'custom';
  customPayload?: string;
  fgColor: string;
  bgColor: string;
}

export interface SignatureElementStyle {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  signerName: string;
  signerTitle: string;
  signImageUrl?: string;
}

export interface IDCardTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'panitia' | 'instansi' | 'sekolah' | 'seminar' | 'umum';
  orientation: Orientation;
  widthMm: number; // standard: 54
  heightMm: number; // standard: 86
  backgroundColor: string;
  backgroundGradient?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    direction: string; // e.g., 'to bottom right'
    color1: string;
    color2: string;
    color3?: string;
  };
  backgroundImage?: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  patternOverlay?: 'none' | 'dots' | 'waves' | 'lines' | 'geometric';

  // Configurable elements
  header: HeaderElementStyle;
  photo: PhotoElementStyle;
  nameElement: ElementStyle;
  roleElement: ElementStyle & { isBadge?: boolean; badgeBg?: string };
  eventElement: ElementStyle;
  institutionElement: ElementStyle;
  idNumberElement: ElementStyle & { prefix?: string };
  expiryElement: ElementStyle & { label?: string };
  logo1: LogoElementStyle;
  logo2: LogoElementStyle;
  qrCode: QrElementStyle;
  signature: SignatureElementStyle;
  accentBarColor?: string;
}

export interface Peserta {
  id: string;
  nomor: number;
  nama: string;
  jabatan: string;
  kegiatan: string;
  instansi: string;
  noIdentitas: string;
  fotoUrl: string;
  templateId: string;
  masaBerlaku?: string;
  qrCustomData?: string;
  createdAt: string;
  catatan?: string;
}

export interface Kegiatan {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  keterangan: string;
  status: 'aktif' | 'akan_datang' | 'selesai';
}

export interface AktivitasLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface PrintSettings {
  paperSize: 'A4' | 'F4' | 'SINGLE';
  orientation: 'portrait' | 'landscape';
  cardsPerRow: number;
  cardsPerColumn: number;
  marginMm: number;
  gapMm: number;
  showCutMarks: boolean;
  scalePercent: number;
}

export type UserRole = 'Administrator' | 'Operator' | 'Viewer';

export interface UserSession {
  username: string;
  role: UserRole;
  fullName: string;
  lastLogin: string;
}

export interface GasConnectionConfig {
  spreadsheetId: string;
  webAppUrl: string;
  driveFolderId: string;
  isLiveConnected: boolean;
  lastSync?: string;
}
