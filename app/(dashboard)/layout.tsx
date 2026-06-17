import { CreateFab } from "@/app/components/dashboard/CreateFab";
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader";
import { MobileBottomBar } from "@/app/components/dashboard/MobileBottomBar";
import { Sidebar } from "@/app/components/dashboard/Sidebar";
import { getUser, isSuperAdmin } from "@/app/services/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUser();
  const isSuper = await isSuperAdmin();

  return (
    <>
      <DashboardHeader profile={profile} />
      <div className={`flex md:h-[calc(100vh-64px)] h-[calc(100vh-128px)]`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
      <MobileBottomBar />
      <CreateFab />
    </>
  );
}
