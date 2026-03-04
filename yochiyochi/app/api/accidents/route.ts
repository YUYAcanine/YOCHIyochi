import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { resolveFoodId } from "@/lib/foodNameResolver";

export const runtime = "nodejs";

type AccidentRow = {
  id: number;
  created_at: string;
  enji_id: number;
  food_id: number | null;
  accident_content: string | null;
  public: boolean | null;
};

const toGardenId = (memberId: string): string | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
};

const resolveEnjiId = async (gardenId: string, childName: string): Promise<number | null> => {
  const trimmed = childName.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("B_enji")
    .select("id")
    .eq("garden_id", gardenId)
    .eq("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || data?.id == null) return null;
  const id = Number(data.id);
  return Number.isFinite(id) ? id : null;
};

const buildFoodNameMap = async (foodIds: number[], gardenId?: string) => {
  const foodNameMap = new Map<number, string>();
  if (foodIds.length === 0) return foodNameMap;

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
  return foodNameMap;
};

const mapAccidentItems = async (
  accidents: AccidentRow[],
  enjiRows: Array<{ id: number; name: string | null }>,
  gardenId?: string
) => {
  const enjiNameMap = new Map<number, string>(
    enjiRows.map((row) => [row.id, (row.name ?? "").trim()])
  );

  const foodIds = Array.from(
    new Set(
      accidents.map((row) => row.food_id).filter((id): id is number => typeof id === "number")
    )
  );
  const foodNameMap = await buildFoodNameMap(foodIds, gardenId);

  return accidents.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    child_name: enjiNameMap.get(row.enji_id) ?? "",
    food_name: typeof row.food_id === "number" ? foodNameMap.get(row.food_id) ?? "" : "",
    accident_content: row.accident_content ?? "",
    public: row.public,
  }));
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("member_id");
    const publicOnly = searchParams.get("public") === "true";
    const limit = Number(searchParams.get("limit") ?? "200");
    const normalizedLimit = Number.isNaN(limit) ? 200 : Math.min(limit, 200);

    if (memberId) {
      const gardenId = toGardenId(memberId);
      if (gardenId == null) {
        return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
      }

      const { data: enjiData, error: enjiError } = await supabase
        .from("B_enji")
        .select("id, name")
        .eq("garden_id", gardenId);

      if (enjiError) {
        console.error(enjiError);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }

      const enjiRows = (enjiData ?? []) as Array<{ id: number; name: string | null }>;
      const enjiIds = enjiRows.map((row) => row.id);
      if (enjiIds.length === 0) return NextResponse.json({ items: [] });

      let query = supabase
        .from("B_accident")
        .select("id, created_at, enji_id, food_id, accident_content, public")
        .in("enji_id", enjiIds)
        .order("created_at", { ascending: false })
        .limit(normalizedLimit);

      if (publicOnly) {
        query = query.eq("public", true);
      }

      const { data: accidentData, error: accidentError } = await query;
      if (accidentError) {
        console.error(accidentError);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }

      const accidents = (accidentData ?? []) as AccidentRow[];
      const items = await mapAccidentItems(accidents, enjiRows, gardenId);
      return NextResponse.json({ items });
    }

    if (publicOnly) {
      const { data: accidentData, error: accidentError } = await supabase
        .from("B_accident")
        .select("id, created_at, enji_id, food_id, accident_content, public")
        .eq("public", true)
        .order("created_at", { ascending: false })
        .limit(normalizedLimit);

      if (accidentError) {
        console.error(accidentError);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }

      const accidents = (accidentData ?? []) as AccidentRow[];
      const enjiIds = Array.from(new Set(accidents.map((row) => row.enji_id)));
      const { data: enjiData, error: enjiError } = await supabase
        .from("B_enji")
        .select("id, name")
        .in("id", enjiIds.length > 0 ? enjiIds : [-1]);

      if (enjiError) {
        console.error(enjiError);
        return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
      }

      const enjiRows = (enjiData ?? []) as Array<{ id: number; name: string | null }>;
      const items = await mapAccidentItems(accidents, enjiRows);
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "missing member_id" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { child_name, food_name, accident_content, public: isPublic, member_id, food_id } =
      await req.json();

    if (!child_name || !food_name || !accident_content || !member_id) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const gardenId = toGardenId(member_id);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const enjiId = await resolveEnjiId(gardenId, child_name);
    if (enjiId == null) {
      return NextResponse.json(
        { error: "園児情報タブで園児を登録してください" },
        { status: 400 }
      );
    }

    const resolvedFoodId =
      typeof food_id === "number" ? food_id : await resolveFoodId(gardenId, food_name);
    if (resolvedFoodId == null) {
      return NextResponse.json({ error: "登録済みの食材を選択してください" }, { status: 400 });
    }

    const { error } = await supabase.from("B_accident").insert({
      enji_id: enjiId,
      food_id: resolvedFoodId,
      accident_content,
      public: Boolean(isPublic),
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

export async function PUT(req: Request) {
  try {
    const { id, child_name, food_name, accident_content, public: isPublic, member_id, food_id } =
      await req.json();

    if (typeof id !== "number" || !child_name || !food_name || !accident_content || !member_id) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const gardenId = toGardenId(member_id);
    if (gardenId == null) {
      return NextResponse.json({ error: "member_id が不正です" }, { status: 400 });
    }

    const { data: enjiData, error: enjiError } = await supabase
      .from("B_enji")
      .select("id")
      .eq("garden_id", gardenId);

    if (enjiError) {
      console.error(enjiError);
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }

    const ownedEnjiIds = new Set(
      ((enjiData ?? []) as Array<{ id: number }>).map((row) => row.id)
    );

    const { data: current, error: currentError } = await supabase
      .from("B_accident")
      .select("id, enji_id")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (currentError || !current || !ownedEnjiIds.has(current.enji_id)) {
      return NextResponse.json({ error: "更新対象が見つかりません" }, { status: 404 });
    }

    const enjiId = await resolveEnjiId(gardenId, child_name);
    if (enjiId == null) {
      return NextResponse.json(
        { error: "園児情報タブで園児を登録してください" },
        { status: 400 }
      );
    }

    const resolvedFoodId =
      typeof food_id === "number" ? food_id : await resolveFoodId(gardenId, food_name);
    if (resolvedFoodId == null) {
      return NextResponse.json({ error: "登録済みの食材を選択してください" }, { status: 400 });
    }

    const { error } = await supabase
      .from("B_accident")
      .update({
        enji_id: enjiId,
        food_id: resolvedFoodId,
        accident_content,
        public: Boolean(isPublic),
      })
      .eq("id", id);

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
