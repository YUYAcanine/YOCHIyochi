import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

const isRecordType = (value: unknown): value is "growth" | "hiyari" =>
  value === "growth" || value === "hiyari";

export async function POST(req: Request) {
  try {
    const {
      child_name,
      age_month,
      record_type,
      food_name,
      detail,
      member_id,
      food_id,
    } = await req.json();

    if (
      !child_name ||
      typeof age_month !== "number" ||
      Number.isNaN(age_month) ||
      !record_type ||
      !food_name ||
      !detail ||
      !member_id ||
      !isRecordType(record_type)
    ) {
      return NextResponse.json(
        { error: "必須項目が不足しています。" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("yochiyochi_meal_records").insert({
      child_name,
      age_month,
      record_type,
      food_name,
      detail,
      member_id,
      food_id: typeof food_id === "number" ? food_id : null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "保存に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("type");
    const memberId = searchParams.get("member_id");
    const limit = Number(searchParams.get("limit") ?? "5");

    let query = supabase
      .from("yochiyochi_meal_records")
      .select("id, child_name, age_month, food_name, detail, record_type, created_at")
      .order("created_at", { ascending: false })
      .limit(Number.isNaN(limit) ? 5 : Math.min(limit, 200));

    if (recordType && isRecordType(recordType)) {
      query = query.eq("record_type", recordType);
    }

    if (memberId) {
      query = query.eq("member_id", memberId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "取得に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
