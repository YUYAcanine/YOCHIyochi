import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

const isRecordType = (value: unknown): value is "growth" | "hiyari" =>
  value === "growth" || value === "hiyari";

const toGardenId = (memberId: string): string | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
};

export async function POST() {
  return NextResponse.json(
    { error: "このAPIの新規登録は廃止されました。/api/accidents を利用してください。" },
    { status: 410 }
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("type");
    const memberId = searchParams.get("member_id");
    const limit = Number(searchParams.get("limit") ?? "5");

    if (recordType && !isRecordType(recordType)) {
      return NextResponse.json({ items: [] });
    }
    if (recordType === "growth") {
      return NextResponse.json({ items: [] });
    }

    const normalizedLimit = Number.isNaN(limit) ? 5 : Math.min(limit, 200);

    let enjiRows: Array<{ id: number; name: string | null; age: number | null }> = [];
    let gardenId: string | null = null;
    if (memberId) {
      gardenId = toGardenId(memberId);
      if (gardenId == null) {
        return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("B_enji")
        .select("id, name, age")
        .eq("garden_id", gardenId);
      if (error) {
        console.error(error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }
      enjiRows = (data ?? []) as Array<{ id: number; name: string | null; age: number | null }>;
      if (enjiRows.length === 0) return NextResponse.json({ items: [] });
    } else {
      const { data, error } = await supabase.from("B_enji").select("id, name, age").limit(5000);
      if (error) {
        console.error(error);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }
      enjiRows = (data ?? []) as Array<{ id: number; name: string | null; age: number | null }>;
    }

    const enjiIds = enjiRows.map((row) => row.id);
    if (enjiIds.length === 0) return NextResponse.json({ items: [] });

    const { data: accidentData, error: accidentError } = await supabase
      .from("B_accident")
      .select("id, created_at, enji_id, food_id, accident_content")
      .in("enji_id", enjiIds)
      .order("created_at", { ascending: false })
      .limit(normalizedLimit);

    if (accidentError) {
      console.error(accidentError);
      return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }

    const accidents = (accidentData ?? []) as Array<{
      id: number;
      created_at: string;
      enji_id: number;
      food_id: number | null;
      accident_content: string | null;
    }>;

    const foodIds = Array.from(
      new Set(accidents.map((row) => row.food_id).filter((id): id is number => typeof id === "number"))
    );
    const foodNameMap = new Map<number, string>();
    if (foodIds.length > 0) {
      const [{ data: aCookData }, { data: bCookData }] = await Promise.all([
        supabase.from("A_cook").select("id, food_name").in("id", foodIds),
        gardenId == null
          ? supabase.from("B_cook").select("food_id, food_name").in("food_id", foodIds)
          : supabase
              .from("B_cook")
              .select("food_id, food_name")
              .eq("garden_id", gardenId)
              .in("food_id", foodIds),
      ]);

      for (const row of (aCookData ?? []) as Array<{ id: number; food_name: string | null }>) {
        if (typeof row.food_name === "string") {
          foodNameMap.set(row.id, row.food_name);
        }
      }
      for (const row of (bCookData ?? []) as Array<{ food_id: number | null; food_name: string | null }>) {
        if (typeof row.food_id === "number" && typeof row.food_name === "string") {
          if (!foodNameMap.has(row.food_id)) {
            foodNameMap.set(row.food_id, row.food_name);
          }
        }
      }
    }

    const enjiMap = new Map(
      enjiRows.map((row) => [
        row.id,
        { child_name: (row.name ?? "").trim(), age_month: Number(row.age ?? 0) },
      ])
    );

    const items = accidents.map((row) => ({
      id: row.id,
      child_name: enjiMap.get(row.enji_id)?.child_name ?? "",
      age_month: enjiMap.get(row.enji_id)?.age_month ?? 0,
      food_name: typeof row.food_id === "number" ? foodNameMap.get(row.food_id) ?? "" : "",
      detail: row.accident_content ?? "",
      record_type: "hiyari" as const,
      created_at: row.created_at,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
