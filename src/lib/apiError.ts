export class ApiError extends Error {
  type: string;
  status: number;

  constructor(message: string, type: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

/**
 * Resolves an error to a translated message.
 * Pass `useTranslations('errors')` as `tErrors`.
 * Falls back to the raw error message if the type key is not found.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveApiError(err: unknown, tErrors: any): string {
  if (err instanceof ApiError) {
    try {
      const msg = tErrors(err.type);
      return msg ?? err.message;
    } catch {
      return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  try {
    return tErrors('UNKNOWN');
  } catch {
    return 'An unexpected error occurred.';
  }
}
