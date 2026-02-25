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

const toGardenId = (memberId: string): string | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
};

const nextAvailableFoodId = async (): Promise<number | null> => {
  const [{ data: maxACook, error: aError }, { data: maxBCook, error: bError }] =
    await Promise.all([
      supabase.from("A_cook").select("id").order("id", { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from("B_cook")
        .select("food_id")
        .not("food_id", "is", null)
        .order("food_id", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (aError || bError) {
    console.error(aError ?? bError);
    return null;
  }

  const maxA = Number(maxACook?.id);
  const maxB = Number(maxBCook?.food_id);
  const base = Math.max(Number.isFinite(maxA) ? maxA : 0, Number.isFinite(maxB) ? maxB : 0);
  return base + 1;
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
    let resolvedFoodId = Number.isFinite(foodId) ? foodId : null;

    let existingId: number | null = null;
    let existingFoodId: number | null = null;
    if (resolvedFoodId != null) {
      const { data: existingByFoodId, error: existingByFoodIdError } = await supabase
        .from("B_cook")
        .select("id, food_id")
        .eq("garden_id", gardenId)
        .eq("food_id", resolvedFoodId)
        .limit(1)
        .maybeSingle();

      if (existingByFoodIdError) {
        console.error(existingByFoodIdError);
        return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
      }
      existingId = typeof existingByFoodId?.id === "number" ? existingByFoodId.id : null;
      existingFoodId =
        typeof existingByFoodId?.food_id === "number" ? existingByFoodId.food_id : null;
    }

    if (existingId == null) {
      const { data: existingByName, error: existingByNameError } = await supabase
        .from("B_cook")
        .select("id, food_id")
        .eq("garden_id", gardenId)
        .eq("food_name", foodName)
        .limit(1)
        .maybeSingle();

      if (existingByNameError) {
        console.error(existingByNameError);
        return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
      }
      existingId = typeof existingByName?.id === "number" ? existingByName.id : null;
      existingFoodId = typeof existingByName?.food_id === "number" ? existingByName.food_id : null;
    }

    if (resolvedFoodId == null) {
      if (existingFoodId != null) {
        resolvedFoodId = existingFoodId;
      } else {
        resolvedFoodId = await nextAvailableFoodId();
      }
    }

    if (resolvedFoodId == null) {
      return NextResponse.json({ error: "food_id の採番に失敗しました" }, { status: 500 });
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

    const { error: insertError } = await supabase
      .from("B_cook")
      .insert({
        garden_id: gardenId,
        food_id: resolvedFoodId,
        food_name: foodName,
        ...updateValues,
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
