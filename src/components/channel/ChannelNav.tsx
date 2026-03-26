"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CategoryList } from "@/types";

interface ChannelNavProps {
  channels: CategoryList;
  currentId: number;
}

export function ChannelNav({ channels, currentId }: ChannelNavProps) {
  const [isHidden, setIsHidden] = useState(false);
  const scrollRef = useRef<HTMLUListElement>(null);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      // 当滚动超过 100px 时隐藏切换器
      setIsHidden(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed top-15 w-full h-25 bg-linear-to-b from-[#000000D9] to-transparent transition-transform duration-300 ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="w-full h-15 border-b border-[#ffffff1a]">
        <div className="max-w-7xl mx-auto w-full h-full px-8">
          <div className="flex items-center w-full h-full relative">
            {/* 左滑 */}
            <div className="h-full top-0 -left-6 absolute items-center flex z-10">
              <button
                onClick={() => scroll("left")}
                className="flex items-center outline-0 focus:none border-2 border-white text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            {/* 右滑 */}
            <div className="h-full top-0 -right-6 absolute items-center flex z-10">
              <button
                onClick={() => scroll("right")}
                className="flex items-center outline-0 focus:none border-2 border-white text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 频道列表 */}
            <ul
              ref={scrollRef}
              className="h-full w-full overflow-x-scroll flex items-center gap-4 overflow-y-hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {channels.map((channel) => {
                const channelHref =
                  channel.children && channel.children.length > 0
                    ? `/channel/${channel.id}/${channel.children[0].id}`
                    : `/channel/${channel.id}`;
                const isActive = channel.id === currentId;

                return (
                  <li key={channel.id} className="inline-flex items-center h-full">
                    <Link
                      href={channelHref}
                      className="flex items-center gap-2 h-full group"
                    >
                      <div className="relative h-full flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <Avatar url={channel.avatar} className="size-10" />
                          {!isActive && (
                            <span className=" absolute inset-0 after:block after:absolute after:w-full after:h-full after:content-[' '] after:rounded-full after:z-20 after:bg-black/40 group-hover:after:bg-black/0 after:transition-colors rounded-full" />
                          )}
                        </div>
                        {isActive && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-4 bg-white rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm text-nowrap ${isActive ? "text-white font-medium" : "text-white/70 group-hover:text-white"}`}
                      >
                        {channel.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}