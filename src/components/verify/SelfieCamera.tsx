"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "starting" | "live" | "captured";

/**
 * Takes a live selfie with the front camera, with an oval guide for the face.
 * If the camera isn't available (permission denied, old browser), it falls back to the phone's
 * camera app via a file input. The photo is kept in memory only and sent once for the check.
 */
export function SelfieCamera({ onChange }: { onChange: (photo: Blob | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(
    () => () => {
      stop();
      if (preview) URL.revokeObjectURL(preview);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function start() {
    setError("");
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("live");
      // Attach after the <video> is on screen.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setPhase("idle");
      setError("We couldn't open your camera. Allow camera access, or use “Use phone camera” below.");
    }
  }

  function keep(blob: Blob) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(blob));
    setPhase("captured");
    onChange(blob);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        keep(blob);
      },
      "image/jpeg",
      0.88,
    );
  }

  /** From the phone's own camera app: shrink to a sensible size first. */
  async function fromFile(file: File) {
    setError("");
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      canvas.toBlob((blob) => blob && keep(blob), "image/jpeg", 0.88);
    } catch {
      if (file.size > 5 * 1024 * 1024) setError("That photo is too large. Please take it again.");
      else keep(file);
    }
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null);
    void start();
  }

  return (
    <div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-[24px] bg-ink">
        {phase === "live" || phase === "starting" ? (
          <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        {phase === "captured" && preview ? <img src={preview} alt="Your selfie" className="h-full w-full -scale-x-100 object-cover" /> : null}

        {phase === "idle" ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white/80">
            <svg viewBox="0 0 48 48" className="h-14 w-14 text-white/60" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <ellipse cx="24" cy="21" rx="9" ry="11" />
              <path d="M9 43c2.5-7 8-10.5 15-10.5S36.5 36 39 43" strokeLinecap="round" />
            </svg>
            <p className="mt-3 text-sm">Face the camera in good light. Remove glasses and caps.</p>
          </div>
        ) : null}

        {/* Oval guide */}
        {phase === "live" || phase === "starting" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-[64%] w-[62%] rounded-[50%] border-[3px] border-white/80 shadow-[0_0_0_999px_rgb(11_15_14/0.45)]" />
          </div>
        ) : null}

        {phase === "starting" ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white border-r-transparent" aria-hidden />
          </span>
        ) : null}
      </div>

      {error ? <p className="mx-auto mt-3 max-w-xs text-center text-sm text-danger-600">{error}</p> : null}

      <div className="mt-4 flex flex-col items-center gap-2">
        {phase === "idle" ? (
          <button type="button" onClick={start} className="inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-3">
            Open camera
          </button>
        ) : null}
        {phase === "live" ? (
          <button
            type="button"
            onClick={capture}
            aria-label="Take selfie"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-line-strong bg-card transition-transform active:scale-95"
          >
            <span className="h-11 w-11 rounded-full bg-ink" />
          </button>
        ) : null}
        {phase === "captured" ? (
          <button type="button" onClick={retake} className="inline-flex h-10 items-center rounded-[10px] border border-line-strong px-4 text-sm font-semibold hover:bg-sand">
            Retake
          </button>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) {
              stop();
              void fromFile(f);
            }
          }}
        />
        {phase !== "captured" ? (
          <button type="button" onClick={() => fileRef.current?.click()} className={cn("text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink")}>
            Use phone camera instead
          </button>
        ) : null}
      </div>
    </div>
  );
}
