import type { ChatMessage, LLM } from "@llamaindex/core/llms";
import { PromptMixin } from "@llamaindex/core/prompts";
import { MetadataMode } from "@llamaindex/core/schema";
import { extractText } from "@llamaindex/core/utils";
import { Settings } from "../Settings.js";
import type { CorrectnessSystemPrompt } from "./prompts.js";
import {
  defaultCorrectnessSystemPrompt,
  defaultUserPrompt,
} from "./prompts.js";
import type {
  BaseEvaluator,
  EvaluationResult,
  EvaluatorParams,
  EvaluatorResponseParams,
} from "./types.js";
import { defaultEvaluationParser } from "./utils.js";

type CorrectnessParams = {
  scoreThreshold?: number;
  parserFunction?: (str: string) => [number, string];
};

/** Correctness Evaluator */
export class CorrectnessEvaluator extends PromptMixin implements BaseEvaluator {
  private scoreThreshold: number;
  private parserFunction: (str: string) => [number, string];
  private llm: LLM;

  private correctnessPrompt: CorrectnessSystemPrompt =
    defaultCorrectnessSystemPrompt;

  constructor(params?: CorrectnessParams) {
    super();

    this.llm = Settings.llm;
    this.correctnessPrompt = defaultCorrectnessSystemPrompt;
    this.scoreThreshold = params?.scoreThreshold ?? 4.0;
    this.parserFunction = params?.parserFunction ?? defaultEvaluationParser;
  }

  protected _getPrompts() {
    return {
      correctnessPrompt: this.correctnessPrompt,
    };
  }
  protected _getPromptModules() {
    return {};
  }

  protected _updatePrompts(prompts: {
    correctnessPrompt: CorrectnessSystemPrompt;
  }) {
    if ("correctnessPrompt" in prompts) {
      this.correctnessPrompt = prompts["correctnessPrompt"];
    }
  }

  /**
   *
   * @param query Query to evaluate
   * @param response  Response to evaluate
   * @param contexts Array of contexts
   * @param reference  Reference response
   */
  async evaluate({
    query,
    response,
    contexts,
    reference,
  }: EvaluatorParams): Promise<EvaluationResult> {
    if (query === null || response === null) {
      throw new Error("query, and response must be provided");
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: this.correctnessPrompt.format(),
      },
      {
        role: "user",
        content: defaultUserPrompt.format({
          query: extractText(query),
          generatedAnswer: response,
          referenceAnswer: reference || "(NO REFERENCE ANSWER SUPPLIED)",
        }),
      },
    ];

    const evalResponse = await this.llm.chat({
      messages,
    });

    const [score, reasoning] = this.parserFunction(
      extractText(evalResponse.message.content),
    );

    return {
      query: query,
      response: response,
      passing: score >= this.scoreThreshold || score === null,
      score: score,
      feedback: reasoning,
    };
  }

  /**
   * @param query Query to evaluate
   * @param response  Response to evaluate
   */
  async evaluateResponse({
    query,
    response,
  }: EvaluatorResponseParams): Promise<EvaluationResult> {
    const responseStr = extractText(response?.message.content);
    const contexts = [];

    if (response) {
      for (const node of response.sourceNodes || []) {
        contexts.push(node.node.getContent(MetadataMode.ALL));
      }
    }

    return this.evaluate({
      query,
      response: responseStr,
      contexts,
    });
  }
}
