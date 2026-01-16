import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "@hey-api/client-fetch",
  input: "./openapi.json", // 或者使用远程 URL: 'https://api.example.com/openapi.json'
  output: {
    path: "./src/api",
    format: "prettier",
    lint: "eslint",
  },
  types: {
    enums: "javascript",
  },
  services: {
    asClass: true,
  },
  plugins: [
    {
      name: '@hey-api/client-next',
      runtimeConfigPath: '../rumtime.config',
    },
  ],
});
