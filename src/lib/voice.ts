"use client";

declare global {
  interface Window {
    responsiveVoice?: {
      cancel?: () => void;
      speak: (
        text: string,
        voice?: string,
        options?: {
          rate?: number;
          pitch?: number;
          volume?: number;
        },
      ) => void;
    };
  }
}

const RESPONSIVE_VOICE_NAME = "Vietnamese Male";
const VOICE_WAIT_TIMEOUT_MS = 8000;
const VOICE_POLL_INTERVAL_MS = 200;

let voiceReadyPromise: Promise<boolean> | null = null;

function hasResponsiveVoice() {
  return typeof window !== "undefined" && typeof window.responsiveVoice?.speak === "function";
}

export function waitForResponsiveVoice(timeoutMs = VOICE_WAIT_TIMEOUT_MS) {
  if (voiceReadyPromise) {
    return voiceReadyPromise;
  }

  voiceReadyPromise = new Promise<boolean>((resolve) => {
    if (hasResponsiveVoice()) {
      resolve(true);
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (hasResponsiveVoice()) {
        window.clearInterval(intervalId);
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(intervalId);
        resolve(false);
      }
    }, VOICE_POLL_INTERVAL_MS);
  });

  return voiceReadyPromise;
}

export async function speakVietnameseAnnouncement(text: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const ready = await waitForResponsiveVoice();
  if (!ready || !window.responsiveVoice) {
    console.error("ResponsiveVoice is not available on this device.");
    return false;
  }

  window.responsiveVoice.cancel?.();
  window.responsiveVoice.speak(text, RESPONSIVE_VOICE_NAME, {
    rate: 0.9,
    pitch: 1,
    volume: 1,
  });

  return true;
}

export async function speakTicketCall(
  ticketNumber: string,
  customerName: string,
  counterName: string,
) {
  const textToSpeak = `Xin mời ông bà ${customerName}, có số thứ tự ${ticketNumber}, đến ${counterName}.`;
  return speakVietnameseAnnouncement(textToSpeak);
}
