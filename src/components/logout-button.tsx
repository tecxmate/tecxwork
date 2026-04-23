"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useStudentI18n } from "@/components/student-locale-provider";

export function LogoutButton() {
  const router = useRouter();
  const { messages } = useStudentI18n();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="mr-1.5 h-3.5 w-3.5" />
      {messages.common.logout}
    </Button>
  );
}
