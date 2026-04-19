"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Hook TTS cho màn hình hiển thị (display page).
 * - Ưu tiên: Web Speech API (vi-VN, miễn phí)
 * - Fallback: Google Translate TTS (chất lượng tốt hơn)
 * - Tự động load voices khi browser sẵn sàng
 */
export const useTTS = () => {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load danh sách voices — voices cần thời gian để browser tải
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /** Phát bằng Web Speech API (lang: vi-VN) */
  const speakWebAPI = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject(new Error("Web Speech API không được hỗ trợ"));
        return;
      }

      // Hủy nếu đang đọc dở
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Ưu tiên chọn voice tiếng Việt nếu có
      const viVoice = voicesRef.current.find(
        (v) =>
          v.lang.toLowerCase().includes("vi") ||
          v.name.toLowerCase().includes("vietnam")
      );
      if (viVoice) utterance.voice = viVoice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /** Fallback: Google Translate TTS */
  const speakGoogleTTS = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }, []);

  /**
   * Phát text tiếng Việt.
   * Tự động thử Google TTS nếu Web Speech API lỗi.
   */
  const speak = useCallback(
    async (text: string) => {
      try {
        await speakWebAPI(text);
      } catch (err) {
        console.warn("[TTS] Web Speech API lỗi, thử Google TTS fallback:", err);
        try {
          await speakGoogleTTS(text);
        } catch (e) {
          console.error("[TTS] Không thể phát âm thanh:", e);
        }
      }
    },
    [speakWebAPI, speakGoogleTTS]
  );

  return { speak };
};
