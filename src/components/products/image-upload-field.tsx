/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useRef, useState } from "react";

type ImageUploadFieldProps = {
  locale: "fr" | "ar";
  existingImageUrl?: string;
  existingImageGallery?: string;
};

export function ImageUploadField({ locale, existingImageUrl, existingImageGallery }: ImageUploadFieldProps) {
  const [imageUrlValue, setImageUrlValue] = useState(existingImageUrl ?? "");
  const [imageGalleryValue, setImageGalleryValue] = useState(existingImageGallery ?? "");
  const [previewSrcList, setPreviewSrcList] = useState<string[]>(existingImageUrl ? [existingImageUrl] : []);
  const [usingFilePreview, setUsingFilePreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];

    if (files.length === 0) {
      setUsingFilePreview(false);
      setSelectedFileNames([]);
      setPreviewSrcList(imageUrlValue ? [imageUrlValue] : []);
      return;
    }

    const objectUrls = files.map((file) => URL.createObjectURL(file));
    objectUrlsRef.current = objectUrls;
    setPreviewSrcList(objectUrls);
    setUsingFilePreview(true);
    setSelectedFileNames(files.map((file) => file.name));
  }

  function applyFiles(files: File[]) {
    if (!fileInputRef.current) {
      return;
    }

    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    fileInputRef.current.files = dt.files;

    onFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      applyFiles(files);
    }
  }

  function onUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextUrl = event.target.value;
    setImageUrlValue(nextUrl);
    if (!usingFilePreview) {
      setPreviewSrcList(nextUrl ? [nextUrl] : []);
    }
  }

  return (
    <div className="space-y-2">
      <input
        name="imageUrl"
        type="url"
        value={imageUrlValue}
        onChange={onUrlChange}
        placeholder={locale === "fr" ? "URL photo produit" : "رابط صورة المنتج"}
        className="w-full rounded-md border border-amber-300 px-3 py-2"
      />

      <textarea
        name="imageGallery"
        value={imageGalleryValue}
        onChange={(event) => setImageGalleryValue(event.target.value)}
        placeholder={
          locale === "fr"
            ? "Galerie images (optionnel): une URL par ligne"
            : "معرض الصور (اختياري): رابط في كل سطر"
        }
        className="w-full rounded-md border border-amber-300 px-3 py-2"
      />

      <label
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-3 py-5 text-center transition ${
          isDragging
            ? "border-amber-700 bg-amber-100 text-amber-900"
            : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        <span className="text-sm font-semibold">
          {locale === "fr" ? "Glisser-deposer une image ici" : "اسحب الصورة وافلتها هنا"}
        </span>
        <span className="mt-1 text-xs">
          {locale === "fr"
            ? "ou cliquez pour choisir une ou plusieurs images"
            : "او اضغط لاختيار صورة واحدة او عدة صور"}
        </span>
      </label>

      <input
        ref={fileInputRef}
        name="imageFiles"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileChange}
        className="w-full rounded-md border border-amber-300 px-3 py-2"
      />
      {selectedFileNames.length > 0 ? (
        <p className="text-xs text-amber-800">
          {locale === "fr" ? "Fichiers choisis" : "الملفات المختارة"}: {selectedFileNames.join(", ")}
        </p>
      ) : null}
      {previewSrcList.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {previewSrcList.map((previewSrc, index) => (
            <img
              key={`${previewSrc}-${index}`}
              src={previewSrc}
              alt={`${locale === "fr" ? "Apercu produit" : "معاينة المنتج"} ${index + 1}`}
              className="h-28 w-full rounded-md border border-amber-200 object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-amber-300 bg-amber-50 text-xs text-amber-800">
          {locale === "fr" ? "Apercu image" : "معاينة الصورة"}
        </div>
      )}
    </div>
  );
}
