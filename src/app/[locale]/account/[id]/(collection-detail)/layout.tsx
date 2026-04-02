import { Sidebar } from "@/components/sidebar/Sidebar";

type CollectionDetailLayoutProps = {
  params: Promise<{ id: string | number; locale: string }>;
  children: React.ReactNode;
};

export default async function CollectionDetailLayout({
  params,
  children,
}: CollectionDetailLayoutProps) {
  await params;

  return (
    <div className="page-container">
      <div className="left-container">{children}</div>
      <div className="right-container">
        <Sidebar />
      </div>
    </div>
  );
}
