export default async function AccountDecorationPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  return (
    <div className="page-container">
      <div className="flex-1 max-w-4xl mx-auto bg-card rounded-xl flex flex-col">
        <div className="px-4 h-14 flex items-center border-b border-border ">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">我的装饰品</span>
          </div>
        </div>
        <div className="flex-1 flex">
          <div
            className="p-4 overflow-y-scroll max-w-30 w-full flex-col space-y-3 border-r border-border "
            style={{ scrollbarWidth: "none" }}
          >
            <div className="hover:bg-primary/20 p-2  group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center">
              <div className="relative size-16">
                <img
                  src="/account/decoration/avatar_frame.svg"
                  alt="avatar_frame"
                  className="absolute w-full h-full top-50% left-50% group-hover:hidden"
                />
                <img
                  src="/account/decoration/avatar_frame_active.svg"
                  alt="avatar_frame"
                  className="h-full w-full hidden group-hover:block"
                />
              </div>

              <span className="text-xs">头像框</span>
            </div>
            <div className="hover:bg-primary/20 p-2  group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center">
              <div className="relative size-16">
                <img
                  src="/account/decoration/emoji.svg"
                  alt="emoji"
                  className="absolute w-full h-full top-50% left-50% group-hover:hidden"
                />
                <img
                  src="/account/decoration/emoji_active.svg"
                  alt="emoji"
                  className="h-full w-full hidden group-hover:block"
                />
              </div>

              <span className="text-xs">表情包</span>
            </div>
            <div className="hover:bg-primary/20 p-2  group aspect-square cursor-pointer rounded-xl flex flex-col items-center justify-center">
              <div className="relative size-16">
                <img
                  src="/account/decoration/comment.svg"
                  alt="comment"
                  className="absolute w-full h-full top-50% left-50% group-hover:hidden"
                />
                <img
                  src="/account/decoration/comment_active.svg"
                  alt="comment"
                  className="h-full w-full hidden group-hover:block"
                />
              </div>

              <span className="text-xs">评论装扮</span>
            </div>
          </div>
          <div className="px-4 pt-6 flex-1"></div>
        </div>
      </div>
    </div>
  );
}
