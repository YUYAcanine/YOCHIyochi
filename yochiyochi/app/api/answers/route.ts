import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type MetaPayload = {
  child_name: string;
  age_month: number;
  note: string;
};

const toGardenId = (memberId: string): number | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return value;
};

const toEnjiId = (memberId: string, childName: string): number => {
  const seed = `${memberId}:${childName}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const encodeMeta = (childName: string, ageMonth: number, note: unknown): string => {
  const payload: MetaPayload = {
    child_name: childName,
    age_month: ageMonth,
    note: typeof note === "string" ? note : "",
  };
  return JSON.stringify(payload);
};

const decodeMeta = (raw: string | null) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MetaPayload>;
    if (
      typeof parsed.child_name === "string" &&
      typeof parsed.age_month === "number"
    ) {
      return {
        child_name: parsed.child_name,
        age_month: parsed.age_month,
        note: typeof parsed.note === "string" ? parsed.note : "",
      };
    }
    return null;
  } catch {
    return null;
  }
};

const resolveFoodId = async (foodName: string): Promise<number | null> => {
  const trimmed = foodName.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("A_cook")
    .select("id")
    .eq("food_name", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
};

export async function POST(req: Request) {
  try {
    const { child_name, age_month, no_eat, can_eat, note, member_id, food_id } =
      await req.json();

    if (
      !child_name ||
      typeof age_month !== "number" ||
      Number.isNaN(age_month) ||
      typeof can_eat !== "boolean" ||
      !member_id
    ) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const gardenId = toGardenId(member_id);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const noEatText = typeof no_eat === "string" ? no_eat : "";
    const resolvedFoodId =
      typeof food_id === "number" ? food_id : await resolveFoodId(noEatText);

    const { error } = await supabase.from("B_enjifood").insert({
      garden_id: gardenId,
      enji_id: toEnjiId(member_id, child_name),
      food_id: resolvedFoodId,
      no_eat: !can_eat,
      note: encodeMeta(child_name, age_month, note),
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
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

    const gardenId = toGardenId(memberId);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("B_enjifood")
      .select("id, food_id, no_eat, note, created_at")
      .eq("garden_id", gardenId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }

    const rows = (data ?? []) as Array<{
      id: number;
      food_id: number | null;
      no_eat: boolean | null;
      note: string | null;
      created_at: string;
    }>;

    const foodIds = Array.from(
      new Set(rows.map((row) => row.food_id).filter((id): id is number => typeof id === "number"))
    );

    let foodNameMap = new Map<number, string>();
    if (foodIds.length > 0) {
      const { data: cookData } = await supabase
        .from("A_cook")
        .select("id, food_name")
        .in("id", foodIds);
      const cooks = (cookData ?? []) as Array<{ id: number; food_name: string | null }>;
      foodNameMap = new Map(
        cooks
          .filter((row) => typeof row.food_name === "string")
          .map((row) => [row.id, row.food_name as string])
      );
    }

    const items = rows.map((row) => {
      const meta = decodeMeta(row.note);
      return {
        id: row.id,
        child_name: meta?.child_name ?? "",
        age_month: meta?.age_month ?? 0,
        no_eat:
          typeof row.food_id === "number"
            ? foodNameMap.get(row.food_id) ?? ""
            : "",
        can_eat: row.no_eat === null ? null : !row.no_eat,
        note: meta?.note ?? "",
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
