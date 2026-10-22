/**
 * 服务端 Cookie 工具函数
 * 用于 Next.js Server Components 和 Server Actions
 */

/**
 * 获取服务端 cookie
 */
export async function getServerCookie(name: string): Promise<string | null> {
  // 确保只在服务端环境中运行
  if (typeof window !== 'undefined') {
    throw new Error('getServerCookie can only be used on the server side');
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);
    return cookie?.value || null;
  } catch (error) {
    console.error('Error getting server cookie:', error);
    return null;
  }
}
