import type { BaseTool, ToolMetadata } from "@llamaindex/core/llms";
import type { BaseQueryEngine } from "@llamaindex/core/query-engine";
import type { JSONSchemaType } from "ajv";

const DEFAULT_NAME = "query_engine_tool";
const DEFAULT_DESCRIPTION =
  "Useful for running a natural language query against a knowledge base and get back a natural language response.";

const DEFAULT_PARAMETERS: JSONSchemaType<QueryEngineParam> = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "The query to search for",
    },
  },
  required: ["query"],
};

export type QueryEngineToolParams = {
  queryEngine: BaseQueryEngine;
  metadata?: ToolMetadata<JSONSchemaType<QueryEngineParam>> | undefined;
};

export type QueryEngineParam = {
  query: string;
};

export class QueryEngineTool implements BaseTool<QueryEngineParam> {
  private queryEngine: BaseQueryEngine;
  metadata: ToolMetadata<JSONSchemaType<QueryEngineParam>>;

  constructor({ queryEngine, metadata }: QueryEngineToolParams) {
    this.queryEngine = queryEngine;
    this.metadata = {
      name: metadata?.name ?? DEFAULT_NAME,
      description: metadata?.description ?? DEFAULT_DESCRIPTION,
      parameters: metadata?.parameters ?? DEFAULT_PARAMETERS,
    };
  }

  async call({ query }: QueryEngineParam) {
    const response = await this.queryEngine.query({ query });

    return response.message.content;
  }
}
