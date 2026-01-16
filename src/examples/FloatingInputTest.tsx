"use client";

import { useState } from "react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { Button } from "@/components/ui/Button";

export function FloatingInputTest() {
  const [value, setValue] = useState("");

  return (
    <div className="max-w-md mx-auto p-8 space-y-4">
      <h2 className="text-2xl font-bold">FloatingInput 测试</h2>
      
      <div className="space-y-2">
        <FloatingInput
          label="测试输入框"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          fullWidth
        />
        
        <div className="text-sm text-gray-600">
          <p>当前值: "{value}"</p>
          <p>值长度: {value.length}</p>
          <p>是否有值: {value ? "是" : "否"}</p>
          <p>trim后: "{value.trim()}"</p>
          <p>Boolean(value && value.trim()): {String(Boolean(value && value.trim()))}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setValue("")}>清空</Button>
          <Button onClick={() => setValue("测试")}>设置值</Button>
          <Button onClick={() => setValue("   ")}>设置空格</Button>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-2">测试步骤：</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>点击输入框 → 标签应该浮动到顶部</li>
          <li>不输入任何内容，点击外部 → 标签应该回到中间</li>
          <li>输入一些文字 → 标签保持在顶部</li>
          <li>删除所有文字 → 标签应该回到中间</li>
          <li>点击"清空"按钮 → 标签应该回到中间</li>
        </ol>
      </div>
    </div>
  );
}
