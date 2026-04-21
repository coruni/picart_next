"use client";

import { DashboardPanel } from "./DashboardPanel";
import { DashboardTableSearch } from "./DashboardTableSearch.client";

type DashboardDataPanelProps = {
  query?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardDataPanel({
  query,
  toolbar,
  children,
}: DashboardDataPanelProps) {
  return (
    <DashboardPanel
      title=""
      action={null}
      headerExtra={
        <>
          {toolbar}
          {query ? (
            <DashboardTableSearch>{query}</DashboardTableSearch>
          ) : null}
        </>
      }
      className="flex min-h-0 flex-1 flex-col"
      headerClassName="sticky top-0 z-20"
      contentClassName="flex min-h-0 flex-1 flex-col px-0 py-0 flex-1"
    >
      <div className="min-h-0 flex-1 ">{children}</div>
    </DashboardPanel>
  );
}
