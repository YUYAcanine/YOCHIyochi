// types/food.ts
export type PhaseKey = "phase1" | "phase2" | "phase3" | "phase4";

export type ParsedRow = {
  food_name: string;
  description_phase1?: string;
  description_phase2?: string;
  description_phase3?: string;
  description_phase4?: string;
};

export type FoodMap = Record<
  string,
  { phase1?: string; phase2?: string; phase3?: string; phase4?: string }
>;
