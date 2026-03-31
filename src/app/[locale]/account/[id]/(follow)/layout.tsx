import { Sidebar } from "@/components/sidebar/Sidebar";

type SocialLayoutProps = {
  params: Promise<{ id: string | number; locale: string }>;
  children: React.ReactNode;
};

export default async function SocialLayout({
  params,
  children,
}: SocialLayoutProps) {
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
