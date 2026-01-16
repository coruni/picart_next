"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

export default function TabsExample() {
  return (
    <div className="w-full max-w-2xl p-6">
      <Tabs defaultValue="recommend">
        <TabsList>
          <TabsTrigger value="follow">关注</TabsTrigger>
          <TabsTrigger value="recommend">推荐</TabsTrigger>
          <TabsTrigger value="activity">活动</TabsTrigger>
        </TabsList>

        <TabsContent value="follow">
          <div className="text-muted-foreground">关注内容</div>
        </TabsContent>

        <TabsContent value="recommend">
          <div className="text-muted-foreground">推荐内容</div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="text-muted-foreground">活动内容</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
