import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class FileParsingError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'FILE_PARSING_ERROR', details);
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'AI_PROVIDER_ERROR', details);
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    console.error(`[${err.code}] ${req.method} ${req.path} -> ${err.message}`);
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
    return;
  }

  // Multer file-size errors arrive as generic errors with a code
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'File is too large. Maximum size exceeded.', details: null },
    });
    return;
  }

  console.error(`[UNHANDLED] ${req.method} ${req.path}`, err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.', details: null },
  });
}
