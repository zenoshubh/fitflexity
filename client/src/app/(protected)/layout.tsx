
import Sidebar from "@/components/Sidebar";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: 'minmax(1px, 120px) 1fr' }}>
      <Sidebar />
      {/* <SampleSidebar /> */}
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}
