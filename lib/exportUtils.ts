import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function exportElementAsPng(element: HTMLElement, filename = 'id-card.png', scale = 3): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: scale,
      cacheBust: true,
      quality: 1,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Gagal mengekspor gambar PNG:', err);
    throw err;
  }
}

export async function exportElementAsJpeg(element: HTMLElement, filename = 'id-card.jpg', scale = 3): Promise<void> {
  try {
    const dataUrl = await toJpeg(element, {
      pixelRatio: scale,
      cacheBust: true,
      quality: 0.95,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Gagal mengekspor gambar JPG:', err);
    throw err;
  }
}

export async function exportElementAsPdf(
  element: HTMLElement,
  filename = 'id-card.pdf',
  orientation: 'portrait' | 'landscape' = 'portrait',
  widthMm = 54,
  heightMm = 86
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 4,
      cacheBust: true,
      quality: 1,
    });

    const pdf = new jsPDF({
      orientation: orientation === 'portrait' ? 'p' : 'l',
      unit: 'mm',
      format: [widthMm, heightMm],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
    pdf.save(filename);
  } catch (err) {
    console.error('Gagal mengekspor PDF:', err);
    throw err;
  }
}

export async function exportMultipleCardsPdf(
  elements: HTMLElement[],
  filename = 'id-card-massal.pdf',
  paperSize: 'A4' | 'F4' = 'A4'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: paperSize === 'F4' ? [215, 330] : 'a4',
    });

    for (let i = 0; i < elements.length; i++) {
      if (i > 0) pdf.addPage();
      const el = elements[i];
      const dataUrl = await toPng(el, {
        pixelRatio: 3,
        cacheBust: true,
      });
      // Center card on page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const cardW = 54;
      const cardH = 86;
      const x = (pageWidth - cardW) / 2;
      const y = (pageHeight - cardH) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, cardW, cardH, undefined, 'FAST');
    }

    pdf.save(filename);
  } catch (err) {
    console.error('Gagal mengekspor PDF massal:', err);
    throw err;
  }
}
