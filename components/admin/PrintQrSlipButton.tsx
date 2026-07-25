"use client";

export default function PrintQrSlipButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-stone-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
    >
      Print QR Slip
    </button>
  );
}