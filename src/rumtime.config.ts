import type { CreateClientConfig } from './api/client.gen';
import { useUserStore } from './stores/useUserStore';
import { getDeviceFingerprintSync } from './lib/fingerprint';
import { getCookie } from './lib/cookies';

const TOKEN_COOKIE_NAME = 'auth-token';
const DEVICE_ID_COOKIE_NAME = 'device_fingerprint';

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

  // 服务端环境 - 使用动态导入的 server-cookies 工具
  try {
    const { getServerCookie } = await import('./lib/server-cookies');
    return await getServerCookie(TOKEN_COOKIE_NAME);
  } catch (error) {
    // 在拦截器中静默处理错误，避免阻塞请求
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to get auth token on server:', error);
    }
    return null;
  }
}

/**
 * 获取设备指纹（支持客户端和服务端）
 */
async function getDeviceId(): Promise<string | null> {
  // 客户端环境
  if (typeof window !== 'undefined') {
    return getDeviceFingerprintSync();
  }

  // 服务端环境 - 使用动态导入的 server-cookies 工具
  try {
    const { getServerCookie } = await import('./lib/server-cookies');
    return await getServerCookie(DEVICE_ID_COOKIE_NAME);
  } catch (error) {
    // 在拦截器中静默处理错误，避免阻塞请求
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to get device ID on server:', error);
    }
    return null;
  }
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

        // Device-Id 始终携带（如果存在）
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
