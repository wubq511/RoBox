export type AnalyzeErrorCode =
  | "analyze_failed"
  | "item_not_found"
  | "missing_deepseek_config"
  | "deepseek_auth_failed"
  | "deepseek_balance_insufficient"
  | "deepseek_context_length"
  | "deepseek_invalid_request"
  | "deepseek_invalid_parameters"
  | "deepseek_rate_limited"
  | "deepseek_server_error"
  | "deepseek_overloaded"
  | "deepseek_timeout"
  | "deepseek_empty_response"
  | "deepseek_bad_response"
  | "deepseek_invalid_json"
  | "deepseek_output_truncated";

const GENERIC_ANALYZE_MESSAGE =
  "分析失败：服务端未返回具体原因，请稍后重试或查看日志。";

export class AnalyzeItemError extends Error {
  code: AnalyzeErrorCode;
  statusCode: number;
  safeMessage: string;

  constructor(
    message: string,
    statusCode = 422,
    code: AnalyzeErrorCode = "analyze_failed",
    safeMessage = message,
  ) {
    super(message);
    this.name = "AnalyzeItemError";
    this.statusCode = statusCode;
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

function getStringProperty(error: unknown, key: string) {
  if (typeof error !== "object" || error === null || !(key in error)) {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function getNumberProperty(error: unknown, key: string) {
  if (typeof error !== "object" || error === null || !(key in error)) {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

export function getAnalyzeErrorStatus(error: unknown) {
  return getNumberProperty(error, "statusCode") ?? 422;
}

export function getAnalyzeClientError(error: unknown) {
  const safeMessage = getStringProperty(error, "safeMessage");
  const code = getStringProperty(error, "code");

  if (safeMessage && code) {
    return {
      error: safeMessage,
      code,
    };
  }

  if (process.env.NODE_ENV === "development") {
    return {
      error: error instanceof Error ? error.message : GENERIC_ANALYZE_MESSAGE,
      code: "analyze_failed",
    };
  }

  return {
    error: GENERIC_ANALYZE_MESSAGE,
    code: "analyze_failed",
  };
}

export function getAnalyzeLogFields(itemId: string, error: unknown) {
  const clientError = getAnalyzeClientError(error);
  const message =
    error instanceof Error
      ? error.message.replace(/\s+/g, " ").slice(0, 240)
      : clientError.error;

  return {
    itemId,
    statusCode: getAnalyzeErrorStatus(error),
    code: clientError.code,
    message,
  };
}
