import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ToastProvider } from "@/components/toast-provider";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (user.role !== "ADMIN") redirect("/");

  return <ToastProvider>{children}</ToastProvider>;
}
