import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// El plan gratis de Supabase pausa el proyecto tras 7 días sin actividad, y
// con él se caerían el panel y la captura de leads. Un cron diario de Vercel
// (vercel.json) llama acá y esto ejecuta public.ping() en la base.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Si CRON_SECRET está definida en Vercel, solo el cron puede llamar.
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("ping");
  if (error) {
    console.error("[keepalive]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: data === 1 });
}
