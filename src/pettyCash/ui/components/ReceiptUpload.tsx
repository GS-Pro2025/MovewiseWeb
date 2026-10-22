import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props { file: File | null; onChange: (f: File | null) => void; }

/** Dashed drop area with an explicit "upload image" call to action and a preview. */
export const ReceiptUpload: React.FC<Props> = ({ file, onChange }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f?: File) => { if (f && f.type.startsWith('image/')) onChange(f); };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      {file && preview ? (
        <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 rounded-lg p-2">
          <img src={preview} alt="" className="w-14 h-14 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-[#0B2863] hover:underline">{t('pettyCash.receipt.change')}</button>
          </div>
          <button type="button" onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500 px-2" aria-label="remove">
            <i className="fas fa-trash" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={`w-full flex flex-col items-center gap-1 border-2 border-dashed rounded-xl py-5 transition-colors ${drag ? 'border-[#0B2863] bg-blue-50' : 'border-gray-300 hover:border-[#0B2863] hover:bg-gray-50'}`}>
          <i className="fas fa-cloud-upload-alt text-2xl text-[#0B2863]" />
          <span className="text-sm font-semibold text-[#0B2863]">{t('pettyCash.receipt.upload')}</span>
          <span className="text-xs text-gray-400">{t('pettyCash.receipt.hint')}</span>
        </button>
      )}
    </div>
  );
};
