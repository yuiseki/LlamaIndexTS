import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // you can download this file to get the latest version of the OpenAPI document
  // @link https://api.cloud.llamaindex.ai/api/openapi.json
  input: "./openapi.json",
  client: "@hey-api/client-fetch",
  output: {
    path: "./src/client",
    format: "prettier",
    lint: "eslint",
  },
  plugins: [
    "@hey-api/schemas",
    "@hey-api/sdk",
    {
      enums: "javascript",
      identifierCase: "preserve",
      name: "@hey-api/typescript",
    },
  ],
});
