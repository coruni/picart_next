"use client";

import { SearchBox } from "@/components/layout/SearchBox";

// Mock categories for testing - using partial type to avoid complex API type requirements
const mockCategories = [
  {
    id: 1,
    name: "原神",
    avatar: "/placeholder/menu.png",
    description: "原神相关内容",
    parentId: null,
    link: "",
    children: [],
    background: null,
    sort: 1,
    status: 1,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: 2,
    name: "崩坏：星穹铁道",
    avatar: "/placeholder/menu.png",
    description: "星铁相关内容",
    parentId: null,
    link: "",
    children: [],
    background: null,
    sort: 2,
    status: 1,
    createdAt: "",
    updatedAt: ""
  },
  {
    id: 3,
    name: "绝区零",
    avatar: "/placeholder/menu.png",
    description: "绝区零相关内容",
    parentId: null,
    link: "",
    children: [],
    background: null,
    sort: 3,
    status: 1,
    createdAt: "",
    updatedAt: ""
  }
] as const;

export function SearchBoxExample() {
  const handleSearch = (query: string, categoryId?: number) => {
    console.log("Search:", { query, categoryId });
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8">SearchBox Component Example</h1>
      
      <div className="space-y-8">
        {/* Normal page style */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Normal Page Style</h2>
          <div className="max-w-2xl">
            <SearchBox
              categories={mockCategories}
              onSearch={handleSearch}
              placeholder="搜索内容..."
            />
          </div>
        </div>

        {/* Account page style (not scrolled) */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-white">Account Page Style (Transparent)</h2>
          <div className="max-w-2xl">
            <SearchBox
              categories={mockCategories}
              isAccountPage={true}
              scrolled={false}
              onSearch={handleSearch}
              placeholder="搜索内容..."
            />
          </div>
        </div>

        {/* Account page style (scrolled) */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-white">Account Page Style (Scrolled)</h2>
          <div className="max-w-2xl">
            <SearchBox
              categories={mockCategories}
              isAccountPage={true}
              scrolled={true}
              onSearch={handleSearch}
              placeholder="搜索内容..."
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Click the input to see search history and hot searches</li>
          <li>• Click the category dropdown to select different categories</li>
          <li>• Search history is automatically saved to localStorage</li>
          <li>• Press Enter or click search button to perform search</li>
          <li>• Click on history or hot search items to search directly</li>
          <li>• Clear search history with the "清空" button</li>
        </ul>
      </div>
    </div>
  );
}