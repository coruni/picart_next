import type { CreateClientConfig } from './api/client.gen';
import { useUserStore } from './stores/useUserStore';
import { useDeviceStore } from './stores/useDeviceStore';
import { getCookie } from './lib/cookies';

const TOKEN_COOKIE_NAME = 'auth-token';
const DEVICE_ID_COOKIE_NAME = 'device_fingerprint';

// 服务端请求的 token 存储（用于 SSR 阶段显式传递 token）
// 注意：这些变量仅用于覆盖，正常情况下拦截器会自动从 cookie 读取
let serverRequestToken: string | null = null;
let serverRequestDeviceId: string | null = null;

/**
 * 设置服务端请求的 token（SSR 阶段使用）
 * 在服务端组件调用 API 前设置，调用后清除
 */
export function setServerRequestToken(token: string | null) {
  serverRequestToken = token;
}

/**
 * 设置服务端请求的设备 ID（SSR 阶段使用）
 */
export function setServerRequestDeviceId(deviceId: string | null) {
  serverRequestDeviceId = deviceId;
}

/**
 * 清除服务端请求的 token 和设备 ID
 */
export function clearServerRequestContext() {
  serverRequestToken = null;
  serverRequestDeviceId = null;
}

/**
 * 获取认证 token（支持客户端和服务端）
 */
async function getAuthToken(): Promise<string | null> {
  // 客户端环境
  if (typeof window !== 'undefined') {
    const storeToken = useUserStore.getState().token;
    if (storeToken) return storeToken;
    return getCookie(TOKEN_COOKIE_NAME);
  }

  // 服务端环境 - 优先从 cookie 读取（标准方式）
  try {
    const { getServerCookie } = await import('./lib/server-cookies');
    const cookieToken = await getServerCookie(TOKEN_COOKIE_NAME);
    if (cookieToken) return cookieToken;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to get auth token from cookie on server:', error);
    }
  }

  // 兜底：使用显式设置的 token（兼容旧代码）
  if (serverRequestToken !== null) {
    return serverRequestToken;
  }

  return null;
}

/**
 * 获取设备指纹（支持客户端和服务端）
 */
async function getDeviceId(): Promise<string | null> {
  // 客户端环境 - 优先从 Store 读取，其次从 Cookie
  if (typeof window !== 'undefined') {
    const storeDeviceId = useDeviceStore.getState().deviceId;
    if (storeDeviceId) return storeDeviceId;

    // Store 中没有，尝试从 Cookie 读取（首次加载或清除后）
    const cookieDeviceId = getCookie(DEVICE_ID_COOKIE_NAME);
    if (cookieDeviceId) {
      // 同步到 Store，下次直接从 Store 读取
      useDeviceStore.getState().setDeviceId(cookieDeviceId);
      return cookieDeviceId;
    }

    return null;
  }

  // 服务端环境 - 优先从 cookie 读取（标准方式）
  // 设备ID在客户端生成后存入cookie，服务端直接使用，绝不生成临时ID
  try {
    const { getServerCookie } = await import('./lib/server-cookies');
    const cookieDeviceId = await getServerCookie(DEVICE_ID_COOKIE_NAME);
    if (cookieDeviceId) return cookieDeviceId;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to get device ID from cookie on server:', error);
    }
  }

  // 兜底：使用显式设置的设备 ID（兼容旧代码）
  if (serverRequestDeviceId !== null) {
    return serverRequestDeviceId;
  }

  return null;
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
});

// 延迟初始化拦截器，避免循环依赖
let interceptorsInitialized = false;
let initializationPromise: Promise<void> | null = null;

export function initializeInterceptors(): Promise<void> {
  if (interceptorsInitialized) return Promise.resolve();

  if (initializationPromise) return initializationPromise;

  // 动态导入 client 以避免循环依赖
  initializationPromise = import('./api/client.gen').then(({ client }) => {
    // 注册请求拦截器（支持异步）
    client.interceptors.request.use(async (request) => {
      try {
        const token = await getAuthToken();
        const deviceId = await getDeviceId();

        // 确保 headers 存在
        if (!request.headers) {
          request.headers = new Headers();
        }

        // 转换为 Headers 对象（如果不是）
        const headers = request.headers instanceof Headers
          ? request.headers
          : new Headers(request.headers as HeadersInit);

        // Device-Id 始终携带（如果存在于Cookie中）
        // 设备ID在客户端生成后，无论是否登录都要携带
        if (deviceId) {
          headers.set('Device-Id', deviceId);
        }

        // Token 仅在已登录时携带
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        request.headers = headers;

        // 开发环境下的调试信息
        if (process.env.NODE_ENV === 'development') {
          console.log('API Request:', {
            url: request.url,
            method: request.method,
            hasToken: !!token,
            token: token || 'none',
            deviceId: deviceId || 'none',
            hasDeviceId: !!deviceId,
            isServer: typeof window === 'undefined'
          });
        }
         
      } catch (error) {
        console.error('Error in request interceptor:', error);
        // 即使出错也要继续请求，只是没有 headers
      }
    });

    // 注册响应拦截器
    client.interceptors.response.use(async (response) => {
      return response;
    });

    // 注册错误拦截器
    client.interceptors.error.use(async (error, response, options) => {
      // 处理 401 未授权错误
      if (response?.status === 401 && typeof window !== 'undefined') {
        console.warn('Unauthorized request, clearing user state');
        
        // 清除用户状态
        const { useUserStore } = await import('@/stores/useUserStore');
        useUserStore.getState().logout();
        
        // 可选：重定向到登录页面
        // window.location.href = '/login';
        
        // 抛出错误，防止继续执行
        throw new Error('Unauthorized');
      }
      
      // 对于其他错误，继续抛出
      throw error;
    });

    interceptorsInitialized = true;
    console.log('API interceptors initialized successfully');
  }).catch((error) => {
    console.error('Failed to initialize API interceptors:', error);
    throw error;
  });

  return initializationPromise;
}
