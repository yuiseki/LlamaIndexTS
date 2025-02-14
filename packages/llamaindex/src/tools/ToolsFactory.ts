import {
  AzureDynamicSessionTool,
  type AzureDynamicSessionToolParams,
} from "@llamaindex/azure";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ToolsFactory {
  type ToolsMap = {
    [Tools.AzureCodeInterpreter]: typeof AzureDynamicSessionTool;
  };

  export enum Tools {
    AzureCodeInterpreter = "azure_code_interpreter.AzureCodeInterpreterToolSpec",
  }

  export async function createTool<Tool extends Tools>(
    key: Tool,
    ...params: ConstructorParameters<ToolsMap[Tool]>
  ): Promise<InstanceType<ToolsMap[Tool]>> {
    if (key === Tools.AzureCodeInterpreter) {
      return new AzureDynamicSessionTool(
        ...(params as AzureDynamicSessionToolParams[]),
      ) as InstanceType<ToolsMap[Tool]>;
    }

    throw new Error(
      `Sorry! Tool ${key} is not supported yet. Options: ${params}`,
    );
  }

  export async function createTools<const Tool extends Tools>(record: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key in Tool]: ConstructorParameters<ToolsMap[Tool]>[1] extends any // backward compatibility for `create-llama` script // if parameters are an array, use them as is
      ? ConstructorParameters<ToolsMap[Tool]>[0]
      : ConstructorParameters<ToolsMap[Tool]>;
  }): Promise<InstanceType<ToolsMap[Tool]>[]> {
    const tools: InstanceType<ToolsMap[Tool]>[] = [];
    for (const key in record) {
      const params = record[key];
      tools.push(
        await createTool(
          key,
          // @ts-expect-error allow array or single parameter
          Array.isArray(params) ? params : [params],
        ),
      );
    }
    return tools;
  }
}
