'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { IDCardTemplate, Peserta } from '@/types/idcard';

interface CardCanvasProps {
  template: IDCardTemplate;
  peserta: Partial<Peserta>;
  scale?: number; // visual scale multiplier
  isEditable?: boolean;
  activeElement?: string | null;
  onSelectElement?: (elementKey: string) => void;
  onElementMove?: (elementKey: string, x: number, y: number) => void;
  className?: string;
}

export const CardCanvas: React.FC<CardCanvasProps> = ({
  template,
  peserta,
  scale = 1.3,
  isEditable = false,
  activeElement = null,
  onSelectElement,
  onElementMove,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Default values
  const nama = peserta.nama || 'NAMA LENGKAP';
  const jabatan = peserta.jabatan || 'Ketua Panitia';
  const kegiatan = peserta.kegiatan || 'Kegiatan Peringatan HGN dan HUT ke-81 PGRI Tahun 2026';
  const instansi = peserta.instansi || 'Kecamatan Pasirwangi';
  const noIdentitas = peserta.noIdentitas || 'PAN-PGRI-2026-001';
  const masaBerlaku = peserta.masaBerlaku || '25 November 2026';
  const fotoUrl =
    peserta.fotoUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  // Base dimensions in mm
  const isLandscape = template.orientation === 'landscape';
  const widthMm = isLandscape ? Math.max(template.widthMm, template.heightMm) : Math.min(template.widthMm, template.heightMm);
  const heightMm = isLandscape ? Math.min(template.widthMm, template.heightMm) : Math.max(template.widthMm, template.heightMm);

  // Conversion: 1mm ~ 3.78px on screen at 96dpi
  const baseWidthPx = widthMm * 3.7795;
  const baseHeightPx = heightMm * 3.7795;

  // Generate QR Code
  useEffect(() => {
    if (!template.qrCode.visible) return;

    let payload = noIdentitas;
    if (template.qrCode.payloadType === 'url') {
      payload = `https://verifikasi.id/card/${encodeURIComponent(noIdentitas)}`;
    } else if (template.qrCode.payloadType === 'vcard') {
      payload = `BEGIN:VCARD\nVERSION:3.0\nFN:${nama}\nTITLE:${jabatan}\nORG:${instansi}\nNOTE:${noIdentitas}\nEND:VCARD`;
    } else if (template.qrCode.payloadType === 'custom' && template.qrCode.customPayload) {
      payload = template.qrCode.customPayload;
    }

    QRCode.toDataURL(payload, {
      margin: 1,
      color: {
        dark: template.qrCode.fgColor || '#000000',
        light: template.qrCode.bgColor || '#ffffff',
      },
      width: 120,
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [template.qrCode, noIdentitas, nama, jabatan, instansi]);

  // Dragging logic for elements
  const handleMouseDown = (elKey: string, e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setDraggingElement(elKey);
    onSelectElement?.(elKey);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditable || !draggingElement || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, Math.round((xPx / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((yPx / rect.height) * 100)));

    onElementMove?.(draggingElement, xPercent, yPercent);
  };

  const handleMouseUp = () => {
    if (draggingElement) {
      setDraggingElement(null);
    }
  };

  // Background style
  const getBackgroundStyle = (): React.CSSProperties => {
    if (template.backgroundImage) {
      return {
        backgroundImage: `url(${template.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    if (template.backgroundGradient?.enabled) {
      const g = template.backgroundGradient;
      if (g.type === 'radial') {
        return {
          background: `radial-gradient(circle at center, ${g.color1}, ${g.color2}${g.color3 ? `, ${g.color3}` : ''})`,
        };
      }
      return {
        background: `linear-gradient(${g.direction || 'to bottom'}, ${g.color1}, ${g.color2}${g.color3 ? `, ${g.color3}` : ''})`,
      };
    }

    return { backgroundColor: template.backgroundColor };
  };

  // Helper for element border highlighter in edit mode
  const getEditHighlight = (elKey: string) => {
    if (!isEditable) return '';
    return activeElement === elKey
      ? 'outline-2 outline-amber-400 outline-dashed cursor-move select-none z-30'
      : 'hover:outline-1 hover:outline-sky-400 hover:outline-dashed cursor-pointer z-20';
  };

  return (
    <div
      style={{
        width: `${baseWidthPx * scale}px`,
        height: `${baseHeightPx * scale}px`,
        position: 'relative',
      }}
      className={`relative select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={containerRef}
        id={`card-canvas-${template.id}`}
        style={{
          width: `${baseWidthPx}px`,
          height: `${baseHeightPx}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          borderRadius: `${template.borderRadius}px`,
          borderColor: template.borderColor,
          borderWidth: `${template.borderWidth}px`,
          borderStyle: 'solid',
          ...getBackgroundStyle(),
        }}
        className="relative overflow-hidden shadow-2xl transition-all"
        onClick={() => isEditable && onSelectElement?.('background')}
      >
        {/* Pattern Overlay */}
        {template.patternOverlay === 'dots' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
              backgroundSize: '12px 12px',
            }}
          />
        )}
        {template.patternOverlay === 'waves' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                'repeating-radial-gradient(circle at 0 0, transparent 0, #ffffff 1px, transparent 12px)',
            }}
          />
        )}
        {template.patternOverlay === 'geometric' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(-45deg, #ffffff 25%, transparent 25%)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        {/* Decorative Top Accent Ribbon */}
        {template.accentBarColor && (
          <div
            className="absolute top-0 left-0 right-0 h-1.5 z-10"
            style={{ backgroundColor: template.accentBarColor }}
          />
        )}

        {/* Logo 1 */}
        {template.logo1.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.logo1.x}%`,
              top: `${template.logo1.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${template.logo1.width * 3.78}px`,
              height: `${template.logo1.height * 3.78}px`,
            }}
            className={getEditHighlight('logo1')}
            onMouseDown={(e) => handleMouseDown('logo1', e)}
          >
            {template.logo1.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.logo1.url}
                alt="Logo 1"
                className="w-full h-full object-contain pointer-events-none drop-shadow"
              />
            ) : (
              <div className="w-full h-full bg-amber-400/20 border border-dashed border-amber-400 rounded flex items-center justify-center text-[8px] text-amber-200">
                Logo 1
              </div>
            )}
          </div>
        )}

        {/* Logo 2 */}
        {template.logo2.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.logo2.x}%`,
              top: `${template.logo2.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${template.logo2.width * 3.78}px`,
              height: `${template.logo2.height * 3.78}px`,
            }}
            className={getEditHighlight('logo2')}
            onMouseDown={(e) => handleMouseDown('logo2', e)}
          >
            {template.logo2.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.logo2.url}
                alt="Logo 2"
                className="w-full h-full object-contain pointer-events-none drop-shadow"
              />
            ) : (
              <div className="w-full h-full bg-sky-400/20 border border-dashed border-sky-400 rounded flex items-center justify-center text-[8px] text-sky-200">
                Logo 2
              </div>
            )}
          </div>
        )}

        {/* Header Text / Badge */}
        {template.header.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.header.x}%`,
              top: `${template.header.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.header.align,
              color: template.header.color,
              fontFamily: template.header.fontFamily,
              fontSize: `${template.header.fontSize}px`,
              fontWeight: template.header.fontWeight,
            }}
            className={`whitespace-nowrap ${getEditHighlight('header')}`}
            onMouseDown={(e) => handleMouseDown('header', e)}
          >
            {template.header.isBadge ? (
              <span
                style={{
                  backgroundColor: template.header.badgeBg || '#1e293b',
                  borderColor: template.borderColor,
                }}
                className="px-2.5 py-0.5 rounded-full border shadow-sm tracking-wider uppercase text-[10px]"
              >
                {template.header.text}
              </span>
            ) : (
              <span className="tracking-wider uppercase drop-shadow-sm">{template.header.text}</span>
            )}
          </div>
        )}

        {/* Photo Box */}
        {template.photo.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.photo.x}%`,
              top: `${template.photo.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${template.photo.width * 3.78}px`,
              height: `${template.photo.height * 3.78}px`,
              borderColor: template.photo.borderColor,
              borderWidth: `${template.photo.borderWidth}px`,
              borderRadius:
                template.photo.shape === 'circle'
                  ? '9999px'
                  : template.photo.shape === 'rounded'
                  ? '10px'
                  : '0px',
              boxShadow: template.photo.shadow ? '0 8px 16px -4px rgba(0,0,0,0.45)' : 'none',
            }}
            className={`overflow-hidden border-solid bg-slate-200 transition-all ${getEditHighlight('photo')}`}
            onMouseDown={(e) => handleMouseDown('photo', e)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt="Foto Profil"
              style={{ objectFit: template.photo.objectFit }}
              className="w-full h-full pointer-events-none"
            />
          </div>
        )}

        {/* Full Name */}
        {template.nameElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.nameElement.x}%`,
              top: `${template.nameElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.nameElement.align,
              color: template.nameElement.color,
              fontFamily: template.nameElement.fontFamily,
              fontSize: `${template.nameElement.fontSize}px`,
              fontWeight: template.nameElement.fontWeight,
              width: '90%',
            }}
            className={`leading-tight px-1 drop-shadow-sm ${getEditHighlight('nameElement')}`}
            onMouseDown={(e) => handleMouseDown('nameElement', e)}
          >
            {nama}
          </div>
        )}

        {/* Role / Jabatan */}
        {template.roleElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.roleElement.x}%`,
              top: `${template.roleElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.roleElement.align,
              color: template.roleElement.color,
              fontFamily: template.roleElement.fontFamily,
              fontSize: `${template.roleElement.fontSize}px`,
              fontWeight: template.roleElement.fontWeight,
            }}
            className={`whitespace-nowrap ${getEditHighlight('roleElement')}`}
            onMouseDown={(e) => handleMouseDown('roleElement', e)}
          >
            {template.roleElement.isBadge ? (
              <span
                style={{ backgroundColor: template.roleElement.badgeBg || '#fbbf24' }}
                className="px-2 py-0.5 rounded shadow-sm font-semibold tracking-wide"
              >
                {jabatan}
              </span>
            ) : (
              <span className="font-semibold tracking-wide">{jabatan}</span>
            )}
          </div>
        )}

        {/* Event Description */}
        {template.eventElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.eventElement.x}%`,
              top: `${template.eventElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.eventElement.align,
              color: template.eventElement.color,
              fontFamily: template.eventElement.fontFamily,
              fontSize: `${template.eventElement.fontSize}px`,
              fontWeight: template.eventElement.fontWeight,
              lineHeight: template.eventElement.lineHeight || 1.3,
              width: '88%',
            }}
            className={`px-1 ${getEditHighlight('eventElement')}`}
            onMouseDown={(e) => handleMouseDown('eventElement', e)}
          >
            {kegiatan}
          </div>
        )}

        {/* Institution */}
        {template.institutionElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.institutionElement.x}%`,
              top: `${template.institutionElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.institutionElement.align,
              color: template.institutionElement.color,
              fontFamily: template.institutionElement.fontFamily,
              fontSize: `${template.institutionElement.fontSize}px`,
              fontWeight: template.institutionElement.fontWeight,
              width: '88%',
            }}
            className={`uppercase tracking-wider px-1 ${getEditHighlight('institutionElement')}`}
            onMouseDown={(e) => handleMouseDown('institutionElement', e)}
          >
            {instansi}
          </div>
        )}

        {/* ID Number */}
        {template.idNumberElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.idNumberElement.x}%`,
              top: `${template.idNumberElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.idNumberElement.align,
              color: template.idNumberElement.color,
              fontFamily: template.idNumberElement.fontFamily,
              fontSize: `${template.idNumberElement.fontSize}px`,
              fontWeight: template.idNumberElement.fontWeight,
            }}
            className={`whitespace-nowrap tracking-wide font-mono ${getEditHighlight('idNumberElement')}`}
            onMouseDown={(e) => handleMouseDown('idNumberElement', e)}
          >
            {(template.idNumberElement.prefix || '') + noIdentitas}
          </div>
        )}

        {/* Expiry Date */}
        {template.expiryElement.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.expiryElement.x}%`,
              top: `${template.expiryElement.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: template.expiryElement.align,
              color: template.expiryElement.color,
              fontFamily: template.expiryElement.fontFamily,
              fontSize: `${template.expiryElement.fontSize}px`,
              fontWeight: template.expiryElement.fontWeight,
            }}
            className={`whitespace-nowrap text-[8px] ${getEditHighlight('expiryElement')}`}
            onMouseDown={(e) => handleMouseDown('expiryElement', e)}
          >
            {(template.expiryElement.label || 'BERLAKU: ') + masaBerlaku}
          </div>
        )}

        {/* QR Code */}
        {template.qrCode.visible && qrDataUrl && (
          <div
            style={{
              position: 'absolute',
              left: `${template.qrCode.x}%`,
              top: `${template.qrCode.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${template.qrCode.size * 3.78}px`,
              height: `${template.qrCode.size * 3.78}px`,
              backgroundColor: template.qrCode.bgColor || '#ffffff',
            }}
            className={`p-1 rounded shadow-md flex items-center justify-center ${getEditHighlight('qrCode')}`}
            onMouseDown={(e) => handleMouseDown('qrCode', e)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        )}

        {/* Signature (Optional) */}
        {template.signature.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${template.signature.x}%`,
              top: `${template.signature.y}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
            className={`flex flex-col items-center ${getEditHighlight('signature')}`}
            onMouseDown={(e) => handleMouseDown('signature', e)}
          >
            <div className="w-16 h-8 border-b border-dashed border-slate-400 flex items-center justify-center text-[8px] text-slate-400 italic">
              [Tanda Tangan]
            </div>
            <div className="text-[7.5px] font-bold text-slate-200 mt-0.5">
              {template.signature.signerName || 'Penanggung Jawab'}
            </div>
            <div className="text-[6.5px] text-slate-400">{template.signature.signerTitle}</div>
          </div>
        )}
      </div>
    </div>
  );
};
