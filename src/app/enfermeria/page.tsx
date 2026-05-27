"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EnfermeriaHome() {
  const router = useRouter();
  useEffect(() => { router.replace("/enfermeria/altas"); }, [router]);
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
