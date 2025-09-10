"use client";

import * as React from "react";

type Props = {
  label?: string;
  onChange: (file: File | null, dataUrl: string | null) => void;
  initialPreviewUrl?: string | null;
  shape?: "circle" | "rounded"; // circle for avatars, rounded for logos/cards
  size?: number; // square size in px
  helperText?: string;
};

export default function ImagePicker({
  label,
  onChange,
  initialPreviewUrl = null,
  shape = "circle",
  size = 64,
  helperText,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = React.useState<string | null>(initialPreviewUrl);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPreview(null);
      onChange(null, null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      setPreview(url);
      onChange(file, url);
    };
    reader.readAsDataURL(file);
  }

  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-md";

  return (
    <div className="space-y-2">
      {label && <div className="text-sm text-neutral-700 font-medium">{label}</div>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors ${radiusClass}`}
        style={{ width: size, height: size }}
        aria-label="Pick image"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className={`absolute inset-0 w-full h-full object-cover ${radiusClass}`} />
        ) : (
          <span className="text-[10px] text-neutral-500">Add image</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      {helperText && <div className="text-xs text-neutral-500">{helperText}</div>}
    </div>
  );
}


