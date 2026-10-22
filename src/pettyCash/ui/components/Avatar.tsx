import React from 'react';

const PALETTE = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600'];

interface Props { name?: string | null; photo?: string | null; size?: number; }

/** Round photo, or colored initials when there is none. */
export const Avatar: React.FC<Props> = ({ name, photo, size = 36 }) => {
  const label = (name ?? '?').trim();
  const initials = label.split(/\s+/).map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  const color = PALETTE[[...label].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length];
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (photo) {
    return <img src={photo} alt={label} style={style} className="rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />;
  }
  return (
    <div style={style} className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white shadow-sm`}>
      {initials}
    </div>
  );
};
