import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { child_name, age_month, no_eat, note, member_id } = await req.json();

    if (!child_name || !age_month || !no_eat || !member_id) {
      return NextResponse.json(
        { error: "すべての項目を入力してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("answers").insert({
      child_name,
      age_month,
      no_eat,
      note,
      member_id,
    });
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "菫晏ｭ倥↓螟ｱ謨励＠縺ｾ縺励◆" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
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
      .from("answers")
      .select("id, child_name, age_month, no_eat, note, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆" },
        { status: 500 }
      );
    }
    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}