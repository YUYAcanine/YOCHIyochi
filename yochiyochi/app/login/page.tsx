"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [memberId, setMemberId] = useState("");
  const [passward, setPassward] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"login" | "register" | null>(null);

  const ensureFieldsFilled = () => {
    if (!memberId.trim() || !passward.trim()) {
      setStatus("会員IDとパスワードを入力してください。");
      return false;
    }
    return true;
  };

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!ensureFieldsFilled()) {
      return;
    }

    setIsLoading(true);
    setLoadingAction("login");
    setStatus("ログイン情報を確認しています…");

    try {
      const { data: existingRecord, error: selectError } = await supabase
        .from("login_credentials")
        .select("id, member_id, password, created_at")
        .eq("member_id", memberId)
        .eq("password", passward)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        throw selectError;
      }

      if (!existingRecord) {
        setStatus("会員IDまたはパスワードが間違っています。");
        if (typeof window !== "undefined") {
          localStorage.removeItem("yochiLoggedIn");
        }
        return;
      }

      const lastRegistered = existingRecord.created_at
        ? new Date(existingRecord.created_at).toLocaleString()
        : "登録日時不明";
      setStatus(`ログインしました。（最終登録：${lastRegistered}）`);
      if (typeof window !== "undefined") {
        localStorage.setItem("yochiLoggedIn", "true");
      }
    } catch (err) {
      console.error("handleLogin error:", err);
      setStatus(getFriendlyErrorMessage("login", err));
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleRegister = async () => {
    if (!ensureFieldsFilled()) {
      return;
    }

    setIsLoading(true);
    setLoadingAction("register");
    setStatus("登録処理を実行しています…");

    try {
      const { data: existingMember, error: checkError } = await supabase
        .from("login_credentials")
        .select("id")
        .eq("member_id", memberId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingMember) {
        setStatus("この会員IDは既に登録されています。ログインをお試しください。");
        return;
      }

      const { error: insertError } = await supabase.from("login_credentials").insert({
        member_id: memberId,
        password: passward,
      });

      if (insertError) {
        throw insertError;
      }

      setStatus("初回登録が完了しました。続けてログインボタンからアクセスできます。");
    } catch (err) {
      console.error("handleRegister error:", err);
      setStatus("登録処理に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F0E4D8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#3A2C25]">会員ログイン</h1>
          <p className="text-sm text-[#6B5A4E]">登録済みの会員IDとパスワードを入力してください</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm font-semibold text-[#4D3F36]">
            会員ID
            <input
              type="text"
              name="memberId"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#D3C5B9] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9c7b6c]"
              placeholder="例：A123456"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-[#4D3F36]">
            パスワード
            <input
              type="password"
              name="passward"
              value={passward}
              onChange={(e) => setPassward(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#D3C5B9] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9c7b6c]"
              placeholder="英数字8桁以上"
              required
            />
          </label>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#9c7b6c] text-white font-semibold py-3 transition hover:bg-[#a88877] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && loadingAction === "login" ? "確認中..." : "ログイン"}
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full rounded-xl border border-[#9c7b6c] text-[#9c7b6c] font-semibold py-3 transition hover:bg-[#f5ede6] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && loadingAction === "register" ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>

        {status && <p className="text-sm text-center text-[#6B5A4E]">{status}</p>}

        <div className="text-center">
          <Link href="/" className="text-[#6B5A4E] font-semibold underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
