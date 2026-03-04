import { supabase } from "@/lib/supabaseClient";

type FoodIdRow = {
  id?: number | string | null;
  food_id?: number | string | null;
};

type FoodAliasRow = {
  food_name: string | null;
  fluctuation_name: string | null;
};

const toNumericId = (value: number | string | null | undefined): number | null => {
  const numericId = Number(value);
  return Number.isFinite(numericId) ? numericId : null;
};

const findFoodIdByCanonicalName = async (foodName: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from("A_cook")
    .select("id")
    .eq("food_name", foodName)
    .limit(1)
    .maybeSingle<FoodIdRow>();

  if (error) return null;
  return toNumericId(data?.id);
};

export const resolveFoodId = async (
  gardenId: string,
  foodName: string
): Promise<number | null> => {
  const trimmed = foodName.trim();
  if (!trimmed) return null;

  const directFoodId = await findFoodIdByCanonicalName(trimmed);
  if (directFoodId != null) return directFoodId;

  const { data: bCook, error: bCookError } = await supabase
    .from("B_cook")
    .select("food_id")
    .eq("garden_id", gardenId)
    .eq("food_name", trimmed)
    .not("food_id", "is", null)
    .limit(1)
    .maybeSingle<FoodIdRow>();

  if (!bCookError) {
    const bCookFoodId = toNumericId(bCook?.food_id);
    if (bCookFoodId != null) return bCookFoodId;
  }

  const { data: aliasRows, error: aliasError } = await supabase
    .from("A_fuluctuation")
    .select("food_name, fluctuation_name")
    .eq("fluctuation_name", trimmed)
    .limit(1)
    .returns<FoodAliasRow[]>();

  if (aliasError || !aliasRows || aliasRows.length === 0) return null;

  const canonicalName = aliasRows[0]?.food_name?.trim() ?? "";
  if (!canonicalName) return null;

  return findFoodIdByCanonicalName(canonicalName);
};
