import { client } from "./generated/client.gen";

// 配置 API 客户端
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
});

// 请求拦截器
client.interceptors.request.use((request) => {
  // 添加认证 token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("picart_token");
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return request;
});

// 响应拦截器
client.interceptors.response.use((response) => {
  // 处理响应
  return response;
});

export { client };
