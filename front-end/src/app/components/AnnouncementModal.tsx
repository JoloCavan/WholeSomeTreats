"use client";

import { useState, useEffect } from "react";
import { Announcement } from "@/app/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export default function AnnouncementModal({ isOpen, onClose, announcements }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first (most recent) whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || announcements.length === 0) return null;

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

  const current = sortedAnnouncements[currentIndex] || sortedAnnouncements[0];
  const total = sortedAnnouncements.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-orange-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Bakery Theme */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-6 text-white text-center relative overflow-hidden">
          {/* Decorative Background Accents */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/15 hover:bg-black/30 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
            aria-label="Close Announcement"
          >
            ✕
          </button>

          {/* Bakery Icon Badge */}
          <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl shadow-inner">
            📢
          </div>

          <span className="inline-block px-3 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xs mb-1">
            WholesomeTreats Bakery
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            Special Bakery Announcement
          </h2>
          <p className="text-xs text-orange-100 font-medium mt-0.5">
            Fresh updates directly from our artisan kitchen
          </p>
        </div>

        {/* Modal Body / Active Announcement Card */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            {currentIndex === 0 ? (
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span>✨</span>
                <span>Latest Update</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                Announcement #{current.id}
              </span>
            )}
            <span className="text-stone-400 font-bold text-[11px] flex items-center gap-1">
              <span>🗓️</span>
              <span>{formatDate(current.created_at)}</span>
            </span>
          </div>

          {/* Title & Content */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-2">
            <h3 className="text-lg font-black text-stone-900 leading-snug">
              {current.title}
            </h3>
            <p className="text-xs text-stone-700 font-medium leading-relaxed whitespace-pre-line">
              {current.content}
            </p>
            <div className="pt-2 text-[11px] text-orange-700 font-bold flex items-center gap-1.5">
              <span>👨‍🍳</span>
              <span>By: WholesomeTreats Bakery Owner</span>
            </div>
          </div>

          {/* Slider Pagination Controls (shown if more than 1 announcement) */}
          {total > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-orange-50 text-stone-700 hover:text-orange-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {sortedAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? "w-6 bg-orange-600" : "w-2 bg-stone-200 hover:bg-stone-300"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-orange-50 text-stone-700 hover:text-orange-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 pt-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-600/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span>🍰</span>
            <span>Explore Fresh Treats</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

