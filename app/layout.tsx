import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Desain Kartu Peserta & Name Tag Kegiatan',
  description: 'Aplikasi pembuatan kartu tanda peserta kegiatan, name tag panitia acara, dan tiket seminar berbasis Google Spreadsheet.',
  openGraph: {
    title: 'Desain Kartu Peserta & Name Tag Kegiatan',
    description: 'Aplikasi pembuatan kartu tanda peserta kegiatan, name tag panitia acara, dan tiket seminar berbasis Google Spreadsheet.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Desain Kartu Peserta & Name Tag Kegiatan',
    description: 'Aplikasi pembuatan kartu tanda peserta kegiatan, name tag panitia acara, dan tiket seminar berbasis Google Spreadsheet.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
