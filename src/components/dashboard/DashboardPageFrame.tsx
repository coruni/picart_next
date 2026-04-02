type DashboardPageFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export function DashboardPageFrame({
  children,
  className,
}: DashboardPageFrameProps) {
  return (
    <div
      className={`mx-auto flex w-full flex-col gap-6 px-4 py-2 ${className || ""}`}
    >
      {children}
    </div>
  );
}
