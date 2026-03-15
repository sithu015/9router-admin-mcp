import { z } from "zod";

export type NormalizedError = {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
};

const ApiErrorSchema = z
  .object({
    error: z.union([
      z.string(),
      z.object({
        code: z.string().optional(),
        message: z.string().optional(),
        details: z.unknown().optional(),
      }),
    ]),
    message: z.string().optional(),
  })
  .partial();

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    default:
      return "HTTP_ERROR";
  }
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof z.ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: "Input validation failed",
      details: err.flatten(),
    };
  }

  if (err instanceof HttpError) {
    const parsed = ApiErrorSchema.safeParse(err.body);
    if (parsed.success) {
      const payload = parsed.data;
      const maybeObjectError =
        typeof payload.error === "object" && payload.error !== null
          ? payload.error
          : undefined;
      const maybeStringError =
        typeof payload.error === "string" ? payload.error : undefined;

      return {
        code: maybeObjectError?.code ?? statusToCode(err.status),
        message:
          maybeObjectError?.message ??
          payload.message ??
          maybeStringError ??
          `Request failed with status ${err.status}`,
        status: err.status,
        details: maybeObjectError?.details ?? err.body,
      };
    }

    return {
      code: statusToCode(err.status),
      message: `Request failed with status ${err.status}`,
      status: err.status,
      details: err.body,
    };
  }

  if (err instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: err.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Unknown error occurred",
    details: err,
  };
}

export function toToolErrorResult(err: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  const normalized = normalizeError(err);
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: normalized }, null, 2),
      },
    ],
  };
}
