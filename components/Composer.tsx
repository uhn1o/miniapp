"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, Paperclip, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { haptic, hapticNotify } from "@/lib/telegram";
import { useT } from "@/lib/i18n";
import type { Attachment } from "@/lib/types";

interface Props {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  isStreaming: boolean;
  externalValue?: string;
  onExternalConsumed?: () => void;
  bottomOffset?: number;
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGES_PER_MSG = 4;
const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
]);
const ACCEPT_ATTR = "image/png,image/jpeg";

export function Composer({ onSend, onStop, isStreaming, externalValue, onExternalConsumed, bottomOffset = 0 }: Props) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = useStore((s) => s.settings);
  const { t } = useT();

  useEffect(() => {
    if (externalValue) {
      setValue(externalValue);
      onExternalConsumed?.();
      taRef.current?.focus();
    }
  }, [externalValue, onExternalConsumed]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || isStreaming) return;
    if (settings.hapticsEnabled) haptic("medium");
    onSend(text, attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_IMAGES_PER_MSG - attachments.length;
    const list = Array.from(files).slice(0, slots);
    const next: Attachment[] = [];
    for (const f of list) {
      if (!ALLOWED_IMAGE_MIME.has(f.type.toLowerCase())) {
        if (settings.hapticsEnabled) hapticNotify("error");
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        if (settings.hapticsEnabled) hapticNotify("error");
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      next.push({ type: "image", dataUrl, mime: f.type, name: f.name });
    }
    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next]);
      if (settings.hapticsEnabled) haptic("light");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
    if (settings.hapticsEnabled) haptic("light");
  };

  return (
    <motion.div
      className="fixed inset-x-0 z-20 px-3 safe-bottom"
      style={{ bottom: bottomOffset }}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 260, delay: 0.05 }}
    >
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-32"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(17,23,15,0.78) 45%, rgba(17,23,15,0.96) 100%)",
        }}
      />

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => onPickFiles(e.target.files)}
      />

      <div className="mx-auto max-w-xl pb-3">
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex gap-2 overflow-x-auto px-1"
            >
              {attachments.map((a, i) => (
                <motion.div
                  key={a.dataUrl}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  className="relative shrink-0"
                >
                  <Image
                    src={a.dataUrl}
                    alt={a.name ?? "attachment"}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-2xl border border-[var(--color-app-line)] object-cover"
                  />
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-danger)] text-neutral-50 shadow-md active:scale-90"
                    aria-label="remove"
                  >
                    <X size={11} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <div className="surface flex min-w-0 flex-1 items-end gap-2 rounded-[26px] px-3 py-2.5">
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 transition-colors hover:text-secondary-300 active:scale-90"
              aria-label={t("composer.attach")}
              onClick={() => {
                if (settings.hapticsEnabled) haptic("light");
                fileRef.current?.click();
              }}
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && settings.sendOnEnter) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("composer.placeholder")}
              rows={1}
              className="min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-[var(--color-text-strong)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
            />

            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 active:scale-90"
              aria-label={t("composer.voice")}
              onClick={() => settings.hapticsEnabled && haptic("light")}
            >
              <Mic size={18} />
            </button>
          </div>

          {isStreaming ? (
            <motion.button
              key="stop"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-danger)] text-neutral-50 shadow-[var(--shadow-press)] active:scale-95"
              onClick={() => {
                if (settings.hapticsEnabled) haptic("heavy");
                onStop?.();
              }}
              aria-label={t("composer.stop")}
            >
              <Square size={18} fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              disabled={!value.trim() && attachments.length === 0}
              className="btn-primary grid h-12 w-12 shrink-0 place-items-center rounded-full disabled:opacity-40 disabled:saturate-50"
              onClick={submit}
              aria-label={t("composer.send")}
            >
              <ArrowUp size={20} strokeWidth={2.6} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}
