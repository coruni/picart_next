export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">个人主页</h2>
      <p className="text-gray-600">用户 ID: {id}</p>
      {/* 这里添加个人主页内容：动态、推荐等 */}
    </div>
  );
}
