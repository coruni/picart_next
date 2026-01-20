export default async function AccountArticlePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">文章列表</h2>
      <p className="text-gray-600">用户 ID: {id}</p>
      {/* 这里添加文章列表内容 */}
    </div>
  );
}
