"use client";

import * as React from "react";
// import heic2any from "heic2any";

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
    <div className="space-y-3">
      <div className="flex flex-col items-center space-y-2">
        {label && <div className="text-sm font-medium text-gray-700 text-center w-full">{label}</div>}
        <div className="flex justify-center">
          <div
            className={`relative flex items-center justify-center border border-gray-300 bg-white ${radiusClass}`}
            style={{ width: size, height: size }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className={`w-full h-full object-cover ${radiusClass}`} />
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors underline"
        >
          {preview ? 'Edit' : 'Add'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      {helperText && <div className="text-xs text-gray-500 text-center">{helperText}</div>}
    </div>
  );
}


