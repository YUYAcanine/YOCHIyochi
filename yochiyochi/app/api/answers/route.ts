import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { child_name, age_month, no_eat, can_eat, note, member_id } = await req.json();

    if (
      !child_name ||
      typeof age_month !== "number" ||
      Number.isNaN(age_month) ||
      !no_eat ||
      typeof can_eat !== "boolean" ||
      !member_id
    ) {
      return NextResponse.json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("enji_info").insert({
      child_name,
      age_month,
      no_eat,
      can_eat,
      note,
      member_id,
    });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "登録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json({ error: "missing member_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("enji_info")
      .select("id, child_name, age_month, no_eat, can_eat, note, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
