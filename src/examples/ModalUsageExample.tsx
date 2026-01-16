"use client";

import { openLoginDialog, openRegisterDialog } from "@/lib/modal-helpers";
import { Button } from "@/components/ui/Button";

/**
 * 在任何地方打开登录对话框的示例
 */
export function ModalUsageExample() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Modal 使用示例</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          你可以在任何地方调用这些函数来打开对话框：
        </p>
        
        <Button onClick={openLoginDialog}>
          打开登录对话框
        </Button>
        
        <Button onClick={openRegisterDialog} variant="outline">
          打开注册对话框
        </Button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">代码示例：</h3>
        <pre className="text-sm overflow-x-auto">
{`import { openLoginDialog } from "@/lib/modal-helpers";

// 在任何组件中
function MyComponent() {
  const handleClick = () => {
    openLoginDialog();
  };
  
  return <button onClick={handleClick}>登录</button>;
}

// 或者在事件处理中
function handleUnauthorized() {
  openLoginDialog();
}

// 甚至在非 React 代码中
if (!isAuthenticated) {
  openLoginDialog();
}`}
        </pre>
      </div>
    </div>
  );
}

/**
 * 在需要登录才能操作的场景中使用
 */
export function ProtectedActionExample() {
  const handleProtectedAction = () => {
    // 检查是否登录
    const isAuthenticated = false; // 从 store 获取
    
    if (!isAuthenticated) {
      // 未登录，打开登录对话框
      openLoginDialog();
      return;
    }
    
    // 已登录，执行操作
    console.log("执行受保护的操作");
  };

  return (
    <Button onClick={handleProtectedAction}>
      点赞（需要登录）
    </Button>
  );
}
