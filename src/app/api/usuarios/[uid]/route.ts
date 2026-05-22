import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function getCallerRole(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection("usuarios").doc(decoded.uid).get();
    return snap.data()?.role ?? null;
  } catch {
    return null;
  }
}

// PATCH — actualizar campos del usuario (esdomed o admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const role = await getCallerRole(req);
  if (role !== "esdomed" && role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { uid } = await params;
  const body = await req.json();
  const allowed = ["jvpm"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? "";
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Sin campos válidos" }, { status: 400 });

  await adminDb.collection("usuarios").doc(uid).update(update);
  return NextResponse.json({ ok: true });
}

// DELETE — eliminar usuario
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const role = await getCallerRole(req);
  if (role !== "esdomed" && role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { uid } = await params;
  await adminAuth.deleteUser(uid);
  await adminDb.collection("usuarios").doc(uid).delete();

  return NextResponse.json({ ok: true });
}
