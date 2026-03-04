import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { resolveFoodId } from "@/lib/foodNameResolver";

export const runtime = "nodejs";

type EnjiFoodRow = {
  id: number;
  created_at: string;
  garden_id: string;
  enji_id: number;
  food_id: number | null;
  no_eat: boolean | null;
  note: string | null;
};

type EnjiRow = {
  id: number;
  created_at?: string | null;
  name?: string | null;
  age?: number | null;
};

type CookRow = {
  id: number;
  food_name: string | null;
};

const toGardenId = (memberId: string): string | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
};

const readChildName = (row: EnjiRow): string =>
  (row.name ?? "").trim();

const readAgeMonth = (row: EnjiRow): number =>
  Number(row.age ?? 0);

const upsertEnji = async (
  gardenId: string,
  childName: string,
  ageMonth: number
): Promise<number | null> => {
  const { data: existingData } = await supabase
    .from("B_enji")
    .select("*")
    .eq("garden_id", gardenId);

  const existingRows = (existingData ?? []) as unknown as EnjiRow[];
  const same = existingRows.find((row) => readChildName(row) === childName);
  if (same?.id) {
    await supabase
      .from("B_enji")
      .update({ age: ageMonth })
      .eq("id", same.id)
      .eq("garden_id", gardenId);
    return same.id;
  }

  const { data, error } = await supabase
    .from("B_enji")
    .insert({ garden_id: gardenId, name: childName, age: ageMonth })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) return null;
  return Number(data.id);
};

export async function POST(req: Request) {
  try {
    const {
      child_name,
      age_month,
      no_eat,
      can_eat,
      note,
      member_id,
      food_id,
      mode,
    } = await req.json();

    if (
      !child_name ||
      typeof age_month !== "number" ||
      Number.isNaN(age_month) ||
      !member_id
    ) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const gardenId = toGardenId(member_id);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const enjiId = await upsertEnji(gardenId, child_name, age_month);
    if (enjiId == null) {
      return NextResponse.json({ error: "園児情報の登録に失敗しました" }, { status: 500 });
    }

    // 園児追加は B_enji のみ登録
    if (mode === "child") {
      return NextResponse.json({ ok: true, enji_id: enjiId });
    }

    const noEatText = typeof no_eat === "string" ? no_eat : "";
    const resolvedFoodId =
      typeof food_id === "number" ? food_id : await resolveFoodId(gardenId, noEatText);
    if (resolvedFoodId == null) {
      return NextResponse.json(
        { error: "登録済みの食材を選択してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("B_enjifood").insert({
      garden_id: gardenId,
      enji_id: enjiId,
      food_id: resolvedFoodId,
      no_eat: typeof can_eat === "boolean" ? !can_eat : true,
      // 具体的な内容をそのまま保存する
      note: typeof note === "string" ? note : "",
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, enji_id: enjiId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, child_name, age_month, no_eat, can_eat, note, member_id, food_id } =
      await req.json();

    if (
      typeof id !== "number" ||
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

    const enjiId = await upsertEnji(gardenId, child_name, age_month);
    if (enjiId == null) {
      return NextResponse.json({ error: "園児情報の更新に失敗しました" }, { status: 500 });
    }

    const noEatText = typeof no_eat === "string" ? no_eat : "";
    const resolvedFoodId =
      typeof food_id === "number" ? food_id : await resolveFoodId(gardenId, noEatText);
    if (resolvedFoodId == null) {
      return NextResponse.json(
        { error: "登録済みの食材を選択してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("B_enjifood")
      .update({
        enji_id: enjiId,
        food_id: resolvedFoodId,
        no_eat: !can_eat,
        note: typeof note === "string" ? note : "",
      })
      .eq("id", id)
      .eq("garden_id", gardenId);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
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

    const [{ data: enjiData, error: enjiError }, { data: foodData, error: foodError }] =
      await Promise.all([
        supabase.from("B_enji").select("*").eq("garden_id", gardenId),
        supabase
          .from("B_enjifood")
          .select("id, created_at, garden_id, enji_id, food_id, no_eat, note")
          .eq("garden_id", gardenId)
          .order("created_at", { ascending: false }),
      ]);

    if (enjiError || foodError) {
      console.error(enjiError ?? foodError);
      return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }

    const enjiRows = (enjiData ?? []) as unknown as EnjiRow[];
    const foodRows = (foodData ?? []) as unknown as EnjiFoodRow[];

    const enjiMap = new Map<
      number,
      { child_name: string; age_month: number; created_at: string }
    >();
    for (const row of enjiRows) {
      const name = readChildName(row);
      if (!name || typeof row.id !== "number") continue;
      enjiMap.set(row.id, {
        child_name: name,
        age_month: readAgeMonth(row),
        created_at: row.created_at ?? "",
      });
    }

    const foodIds = Array.from(
      new Set(foodRows.map((row) => row.food_id).filter((id): id is number => typeof id === "number"))
    );

    const foodNameMap = new Map<number, string>();
    if (foodIds.length > 0) {
      const [{ data: aCookData }, { data: bCookData }] = await Promise.all([
        supabase.from("A_cook").select("id, food_name").in("id", foodIds),
        supabase
          .from("B_cook")
          .select("food_id, food_name")
          .eq("garden_id", gardenId)
          .in("food_id", foodIds),
      ]);

      const cooks = (aCookData ?? []) as unknown as CookRow[];
      for (const row of cooks) {
        if (typeof row.food_name === "string") {
          foodNameMap.set(row.id, row.food_name);
        }
      }

      const bCooks = (bCookData ?? []) as Array<{ food_id: number | null; food_name: string | null }>;
      for (const row of bCooks) {
        if (typeof row.food_id === "number" && typeof row.food_name === "string") {
          if (!foodNameMap.has(row.food_id)) {
            foodNameMap.set(row.food_id, row.food_name);
          }
        }
      }
    }

    const items = foodRows.map((row) => {
      const enji = enjiMap.get(row.enji_id);
      return {
        id: row.id,
        child_name: enji?.child_name ?? `園児${row.enji_id}`,
        age_month: enji?.age_month ?? 0,
        no_eat:
          typeof row.food_id === "number"
            ? foodNameMap.get(row.food_id) ?? ""
            : "",
        can_eat: row.no_eat === null ? null : !row.no_eat,
        note: row.note ?? "",
        created_at: row.created_at,
      };
    });

    // 食材データ未登録の園児も一覧に出す
    const existingNames = new Set(items.map((item) => item.child_name));
    for (const enji of enjiMap.values()) {
      if (existingNames.has(enji.child_name)) continue;
      items.push({
        id: -Math.floor(Math.random() * 1_000_000_000),
        child_name: enji.child_name,
        age_month: enji.age_month,
        no_eat: "",
        can_eat: true,
        note: "",
        created_at: enji.created_at,
      });
    }

    items.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, member_id, child_name, delete_child } = await req.json();

    if (!member_id) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const gardenId = toGardenId(member_id);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    // 園児パネル削除: B_enji から削除し、紐づく B_enjifood も削除
    if (delete_child === true && typeof child_name === "string" && child_name.trim()) {
      const targetName = child_name.trim();
      const { data: enjiData, error: enjiError } = await supabase
        .from("B_enji")
        .select("id, name")
        .eq("garden_id", gardenId);

      if (enjiError) {
        console.error(enjiError);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
      }

      const enjiRows = (enjiData ?? []) as Array<{ id: number; name: string | null }>;
      const targets = enjiRows.filter((row) => (row.name ?? "").trim() === targetName);
      const enjiIds = targets.map((row) => row.id);

      if (enjiIds.length === 0) {
        return NextResponse.json({ ok: true });
      }

      const { error: foodDeleteError } = await supabase
        .from("B_enjifood")
        .delete()
        .eq("garden_id", gardenId)
        .in("enji_id", enjiIds);

      if (foodDeleteError) {
        console.error(foodDeleteError);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
      }

      const { error: enjiDeleteError } = await supabase
        .from("B_enji")
        .delete()
        .eq("garden_id", gardenId)
        .in("id", enjiIds);

      if (enjiDeleteError) {
        console.error(enjiDeleteError);
        return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (typeof id !== "number") {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    // 疑似行（負数ID）は B_enjifood 実体がないため無視
    if (id < 0) return NextResponse.json({ ok: true });

    const { error } = await supabase
      .from("B_enjifood")
      .delete()
      .eq("id", id)
      .eq("garden_id", gardenId);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
