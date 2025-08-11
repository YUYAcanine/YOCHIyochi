"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; //画像を読み込むとpage3 へ遷移させれるようにするためのライブラリ
import Button from "@/components/Button";

export default function Page2() {
  const [images, setImages] = useState<File[]>([]);
  const router = useRouter(); 

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));

     // 写真を格納するfiles を定義
    const files = Array.from(e.target.files);
    setImages(files);

    // page2.tsx の handleImageChange 内
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("uploadedImage", reader.result as string);
      router.push("/page3");　// 写真を読み込み完了後にpage3に遷移
    };
    reader.readAsDataURL(files[0]);

  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-start bg-green-50 pt-10">
      {/* カメラ/ファイル選択 */}
      <div className="flex space-x-4 mt-6 justify-center">
        {/* カメラ（スマホで背面カメラを優先） */}
        <label
          htmlFor="camera-upload"
          className="w-24 h-24 bg-white/70 flex items-center justify-center rounded cursor-pointer shadow"
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

        {/* ファイル選択（いわゆる“フォルダーを開く”ダイアログ） */}
        <label
          htmlFor="file-upload"
          className="w-24 h-24 bg-white/70 flex items-center justify-center rounded cursor-pointer shadow"
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

      {/* プレビュー */}
      {images.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6 mt-6 px-4">
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
      {/* ホームにもどるボタン */}
      <div className="mt-auto mb-10">
        <Button href="/" variant="gray">ホームに戻る</Button>
      </div>
    </main>
  );
}

