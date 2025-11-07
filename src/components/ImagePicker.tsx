"use client";

import * as React from "react";
import { compressImage, fileToDataURL } from "@/lib/imageUtils";

type Props = {
  label?: string;
  onChange: (file: File | null, dataUrl: string | null) => void;
  initialPreviewUrl?: string | null;
  shape?: "circle" | "rounded"; // circle for avatars, rounded for logos/cards
  size?: number; // square size in px
  helperText?: string;
  compress?: boolean; // Enable image compression (default: true)
};

export default function ImagePicker({
  label,
  onChange,
  initialPreviewUrl = null,
  shape = "circle",
  size = 64,
  helperText,
  compress = true,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = React.useState<string | null>(initialPreviewUrl);

  // Keep preview in sync if initialPreviewUrl changes after mount
  React.useEffect(() => {
    setPreview(initialPreviewUrl ?? null);
  }, [initialPreviewUrl]);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('ImagePicker: File selection started');
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      console.log('ImagePicker: No file selected');
      setPreview(null);
      onChange(null, null);
      return;
    }

    console.log('ImagePicker: File selected:', { name: file.name, size: file.size, type: file.type });

    try {
      let processedFile = file;
      
      // Compress image if it's an image file and compression is enabled
      if (compress && file.type.startsWith('image/')) {
        console.log('📸 ImagePicker: Compressing image...');
        processedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });
      }
      
      // Generate preview URL
      const dataUrl = await fileToDataURL(processedFile);
      console.log('ImagePicker: File processed successfully');
      setPreview(dataUrl);
      onChange(processedFile, dataUrl);
    } catch (error) {
      console.error('ImagePicker: Error processing file:', error);
      setPreview(null);
      onChange(null, null);
    }
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
          onClick={() => {
            console.log('ImagePicker: Button clicked, opening file picker');
            try {
              inputRef.current?.click();
              console.log('ImagePicker: File picker opened successfully');
            } catch (error) {
              console.error('ImagePicker: Error opening file picker:', error);
            }
          }}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors underline"
        >
          {preview ? 'Edit' : 'Add'}
        </button>
      </div>
      
      {/* Single input with both camera and library options */}
      <input 
        ref={inputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleSelect} 
      />
      
      {helperText && <div className="text-xs text-gray-500 text-center">{helperText}</div>}
    </div>
  );
}


