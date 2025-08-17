import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-screen md:grid-cols-[minmax(1px,120px)_1fr]">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="overflow-y-auto">{children}</main>
      
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
