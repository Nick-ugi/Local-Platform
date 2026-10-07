import { ERROR_CODES, type ErrorCode, type FieldError } from "@queenstown/shared";

/** The API's own codes, plus two for failures that never produced a Problem Details body. */
export type ApiErrorCode = ErrorCode | "NETWORK_ERROR" | "UNKNOWN_ERROR";

export class ApiError extends Error {
  /** HTTP status, or 0 when no response arrived. */
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly detail: string;
  readonly errors: FieldError[];

  constructor(init: { status: number; code: ApiErrorCode; detail: string; errors?: FieldError[]; cause?: unknown }) {
    super(`${init.code} (${init.status}): ${init.detail}`, { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.errors = init.errors ?? [];
  }
}

const DEFAULT_BASE_URL = "http://localhost:8080";

/** GET {API_BASE_URL}/api/v1{path}. Rejects with an ApiError for every failure. */
export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = process.env.API_BASE_URL || DEFAULT_BASE_URL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, { cache: "no-store" });
  } catch (cause) {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", detail: "The API could not be reached.", cause });
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

/**
 * Reads an error response. The API answers with Problem Details, but a request the server rejects
 * before it reaches the application comes back as an HTML page, so nothing about the body is assumed.
 */
async function toApiError(response: Response): Promise<ApiError> {
  const unknown = new ApiError({
    status: response.status,
    code: "UNKNOWN_ERROR",
    detail: `The API answered with status ${response.status}.`,
  });

  let body: unknown;
  try {
    body = JSON.parse(await response.text());
  } catch {
    return unknown;
  }
  if (!isRecord(body) || !isErrorCode(body.code)) {
    return unknown;
  }

  return new ApiError({
    status: response.status,
    code: body.code,
    detail: typeof body.detail === "string" ? body.detail : unknown.detail,
    errors: Array.isArray(body.errors) ? body.errors.filter(isFieldError) : [],
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return (ERROR_CODES as readonly unknown[]).includes(value);
}

function isFieldError(value: unknown): value is FieldError {
  return isRecord(value) && typeof value.field === "string" && typeof value.message === "string";
}
