import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type Payload = {
  food_name?: unknown;
  member_id?: unknown;
  phase1?: unknown;
  phase2?: unknown;
  phase3?: unknown;
  phase4?: unknown;
  phase5?: unknown;
};

const toText = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

const toGardenId = (memberId: string): number | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return value;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const foodName = toText(body.food_name);
    const memberId = toText(body.member_id);

    if (!foodName) {
      return NextResponse.json({ error: "食材名を入力してください" }, { status: 400 });
    }
    if (!memberId) {
      return NextResponse.json({ error: "member_id が必要です" }, { status: 400 });
    }

    const gardenId = toGardenId(memberId);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const updateValues = {
      phase1: toText(body.phase1),
      phase2: toText(body.phase2),
      phase3: toText(body.phase3),
      phase4: toText(body.phase4),
      phase5: toText(body.phase5),
    };

    const { data: food, error: selectError } = await supabase
      .from("A_cook")
      .select("id")
      .eq("food_name", foodName)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error(selectError);
      return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
    }
    const foodId = Number(food?.id);
    const resolvedFoodId = Number.isFinite(foodId) ? foodId : null;

    let existingId: number | null = null;
    if (resolvedFoodId != null) {
      const { data: existingByFoodId, error: existingByFoodIdError } = await supabase
        .from("B_cook")
        .select("id")
        .eq("garden_id", gardenId)
        .eq("food_id", resolvedFoodId)
        .limit(1)
        .maybeSingle();

      if (existingByFoodIdError) {
        console.error(existingByFoodIdError);
        return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
      }
      existingId = typeof existingByFoodId?.id === "number" ? existingByFoodId.id : null;
    } else {
      const { data: existingByName, error: existingByNameError } = await supabase
        .from("B_cook")
        .select("id")
        .eq("garden_id", gardenId)
        .is("food_id", null)
        .eq("food_name", foodName)
        .limit(1)
        .maybeSingle();

      if (existingByNameError) {
        console.error(existingByNameError);
        return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
      }
      existingId = typeof existingByName?.id === "number" ? existingByName.id : null;
    }

    if (existingId != null) {
      const { error: updateError } = await supabase
        .from("B_cook")
        .update({ ...updateValues, food_name: foodName, food_id: resolvedFoodId })
        .eq("id", existingId)
        .eq("garden_id", gardenId);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id: existingId });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("B_cook")
      .insert({
        garden_id: gardenId,
        food_id: resolvedFoodId,
        food_name: foodName,
        ...updateValues,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted?.id ?? null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
