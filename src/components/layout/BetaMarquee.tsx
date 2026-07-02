'use client';

const LABEL = 'Phiên bản thử nghiệm · Beta version · Phiên bản thử nghiệm · Beta version · ';
const REPEAT = 6;

export default function BetaMarquee() {
  return (
    <div
      className="w-full overflow-hidden shrink-0 bg-amber-950/60 border-b border-amber-800/50"
      style={{ height: '26px' }}
    >
      <div
        className="flex items-center h-full whitespace-nowrap"
        style={{
          animation: 'marquee-scroll 28s linear infinite',
          willChange: 'transform',
        }}
      >
        {Array.from({ length: REPEAT }, (_, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-[11px] font-medium text-amber-300 px-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            {LABEL}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
