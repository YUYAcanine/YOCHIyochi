"use client";

import { useState, ChangeEvent } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-start bg-gray-50 pt-10">
      {/* カメラとファイル選択 */}
      <div className="flex space-x-4 mt-10 justify-center">
        <label
          htmlFor="camera-upload"
          className="w-24 h-24 bg-gray-300 flex items-center justify-center rounded cursor-pointer shadow-md"
        >
          <Camera className="w-8 h-8" />
          <input
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <label
          htmlFor="file-upload"
          className="w-24 h-24 bg-gray-300 flex items-center justify-center rounded cursor-pointer shadow-md"
        >
          <ImageIcon className="w-8 h-8" />
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {/* プレビュー表示 */}
      {images.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {images.map((img, i) => (
            <Image
              key={i}
              src={URL.createObjectURL(img)}
              alt="preview"
              width={192}
              height={192}
              className="rounded shadow"
            />
          ))}
        </div>
      )}

      {/* 下部のページ遷移ボタン */}
      <div className="mt-auto mb-10">
        <Link
          href="/page2"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-500 transition"
        >
          Go to Page 2
        </Link>
      </div>
    </main>
  );
}

