// app/page3/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ChecklistButton, ChecklistPanel } from "@/components/checklist";
import Button from "@/components/Button";


export default function Page3() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    setImgSrc(localStorage.getItem("uploadedImage"));
  }, []);

  return (
    <main className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-8 p-6">
      {/* 画像表示（/page2で選択→localStorage保存したBase64を表示） */}
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt="uploaded"
          width={320}
          height={320}
          className="rounded shadow"
        />
      ) : (
        <p className="text-zinc-700">
          画像がありません。/page2 で画像を選択してください。
        </p>
      )}

      {/* チェックリストUI（構成に応じて並び替えてOK） */}
      <section className="flex flex-col items-center gap-4">
        <ChecklistButton />
        <ChecklistPanel />
      </section>

      {/* ホームにもどると写真を変えるボタン */}
      <Button href="/page2" variant="green">写真を変える</Button>
      <Button href="/" variant="gray">ホームに戻る</Button>
    </main>
  );
}

