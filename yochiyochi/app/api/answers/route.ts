import { NextResponse } from "next/server";
import { getPool } from "@/lib/mysql";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { child_name, age_month, no_eat } = await req.json();

    if (!child_name || !age_month || !no_eat) {
      return NextResponse.json(
        { error: "すべての項目を入力してください" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const sql =
      "INSERT INTO answers (child_name, age_month, no_eat) VALUES (?, ?, ?)";
    await pool.execute(sql, [child_name, age_month, no_eat]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id, child_name, age_month, no_eat, createdAt FROM answers ORDER BY createdAt DESC"
    );
    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
