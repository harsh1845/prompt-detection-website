import type { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";

export const metadata = {
  title: "PromptGuard Console",
};

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await requireTenantContext();
  const unreadAlerts = await prisma.alert.count({
    where: { orgId: context.org.id, readAt: null },
  });

  return (
    <div className="flex min-h-screen flex-col bg-base lg:flex-row">
      <Sidebar unreadAlerts={unreadAlerts} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar context={context} />
        <main className="flex-1 px-5 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
