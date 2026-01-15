"use client";

import { useTranslations } from "next-intl";

export function QuickActions() {
  const t = useTranslations("home");

  const actions = [
    {
      id: "article",
      label: "文章",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      hoverGradient: "hover:from-blue-600 hover:to-cyan-600",
    },
    {
      id: "image",
      label: "图片",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "hover:from-green-600 hover:to-emerald-600",
    },
    {
      id: "video",
      label: "视频",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "hover:from-orange-600 hover:to-red-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-bold mb-5 text-gray-900">快速发布</h3>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            className="group relative overflow-hidden"
          >
            <div className={`flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                {action.icon}
              </div>
              <span className="text-sm font-semibold">
                {action.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
