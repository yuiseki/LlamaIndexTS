import { type BaseReader, Document } from "@llamaindex/core/schema";
import { getEnv } from "@llamaindex/env";
import type {
  AssemblyAI,
  BaseServiceParams,
  SubtitleFormat,
  TranscribeParams,
  TranscriptParagraph,
  TranscriptSentence,
} from "assemblyai";

type AssemblyAIOptions = Partial<BaseServiceParams>;
const defaultOptions = {
  userAgent: {
    integration: {
      // fixme: use `@llamaindex/env`
      name: "LlamaIndexTS",
      version: "1.0.1",
    },
  },
};
/**
 * Base class for AssemblyAI Readers.
 */
abstract class AssemblyAIReader implements BaseReader<Document> {
  protected clientPromise: Promise<AssemblyAI>;

  /**
   * Creates a new AssemblyAI Reader.
   * @param assemblyAIOptions The options to configure the AssemblyAI Reader.
   * Configure the `assemblyAIOptions.apiKey` with your AssemblyAI API key, or configure it as the `ASSEMBLYAI_API_KEY` environment variable.
   */
  constructor(assemblyAIOptions?: AssemblyAIOptions) {
    let options = assemblyAIOptions;
    if (!options) {
      options = {};
    }
    if (!options.apiKey) {
      options.apiKey = getEnv("ASSEMBLYAI_API_KEY")!;
    }
    if (!options.apiKey) {
      throw new Error(
        "No AssemblyAI API key provided. Pass an `apiKey` option, or configure the `ASSEMBLYAI_API_KEY` environment variable.",
      );
    }

    this.clientPromise = import("assemblyai").then(
      ({ AssemblyAI }) =>
        new AssemblyAI({
          ...defaultOptions,
          ...options,
        } as BaseServiceParams),
    );
  }

  abstract loadData(params: TranscribeParams | string): Promise<Document[]>;

  protected async transcribeOrGetTranscript(params: TranscribeParams | string) {
    const client = await this.clientPromise;
    if (typeof params === "string") {
      return await client.transcripts.get(params);
    } else {
      return await client.transcripts.transcribe(params);
    }
  }

  protected async getTranscriptId(params: TranscribeParams | string) {
    if (typeof params === "string") {
      return params;
    } else {
      const client = await this.clientPromise;
      return (await client.transcripts.transcribe(params)).id;
    }
  }
}

/**
 * Transcribe audio and read the transcript as a document using AssemblyAI.
 */
class AudioTranscriptReader extends AssemblyAIReader {
  /**
   * Transcribe audio or get a transcript and load the transcript as a document using AssemblyAI.
   * @param params Parameters to transcribe an audio file or get an existing transcript.
   * @returns A promise that resolves to a single document containing the transcript text.
   */
  async loadData(params: TranscribeParams | string): Promise<Document[]> {
    const transcript = await this.transcribeOrGetTranscript(params);
    return [new Document({ text: transcript.text ?? undefined })];
  }
}

/**
 * Transcribe audio and return a document for each paragraph.
 */
class AudioTranscriptParagraphsReader extends AssemblyAIReader {
  /**
   * Transcribe audio or get a transcript, and returns a document for each paragraph.
   * @param params The parameters to transcribe audio or get an existing transcript.
   * @returns A promise that resolves to an array of documents, each containing a paragraph of the transcript.
   */
  async loadData(params: TranscribeParams | string): Promise<Document[]> {
    const transcriptId = await this.getTranscriptId(params);
    const client = await this.clientPromise;
    const paragraphsResponse =
      await client.transcripts.paragraphs(transcriptId);
    return paragraphsResponse.paragraphs.map(
      (p: TranscriptParagraph) => new Document({ text: p.text }),
    );
  }
}

/**
 * Transcribe audio and return a document for each sentence.
 */
class AudioTranscriptSentencesReader extends AssemblyAIReader {
  /**
   * Transcribe audio or get a transcript, and returns a document for each sentence.
   * @param params The parameters to transcribe audio or get an existing transcript.
   * @returns A promise that resolves to an array of documents, each containing a sentence of the transcript.
   */
  async loadData(params: TranscribeParams | string): Promise<Document[]> {
    const transcriptId = await this.getTranscriptId(params);
    const client = await this.clientPromise;
    const sentencesResponse = await client.transcripts.sentences(transcriptId);
    return sentencesResponse.sentences.map(
      (p: TranscriptSentence) => new Document({ text: p.text }),
    );
  }
}

/**
 * Transcribe audio a transcript and read subtitles for the transcript as `srt` or `vtt` format.
 */
class AudioSubtitlesReader extends AssemblyAIReader {
  /**
   * Transcribe audio or get a transcript and reads subtitles for the transcript as `srt` or `vtt` format.
   * @param params The parameters to transcribe audio or get an existing transcript.
   * @param subtitleFormat The format of the subtitles, either `srt` or `vtt`.
   * @returns A promise that resolves a document containing the subtitles as the page content.
   */
  async loadData(
    params: TranscribeParams | string,
    subtitleFormat: SubtitleFormat = "srt",
  ): Promise<Document[]> {
    const transcriptId = await this.getTranscriptId(params);
    const client = await this.clientPromise;
    const subtitles = await client.transcripts.subtitles(
      transcriptId,
      subtitleFormat,
    );
    return [new Document({ text: subtitles })];
  }
}

export {
  AudioSubtitlesReader,
  AudioTranscriptParagraphsReader,
  AudioTranscriptReader,
  AudioTranscriptSentencesReader,
};

export type { AssemblyAIOptions, SubtitleFormat, TranscribeParams };
