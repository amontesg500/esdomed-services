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

// DELETE — eliminar usuario
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const role = await getCallerRole(req);
  if (role !== "esdomed") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { uid } = await params;
  await adminAuth.deleteUser(uid);
  await adminDb.collection("usuarios").doc(uid).delete();

  return NextResponse.json({ ok: true });
}
