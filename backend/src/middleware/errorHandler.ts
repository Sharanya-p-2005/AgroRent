import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): any {
  // Safe technical logging on the server without exposing secrets
  console.error(`[Error] [${req.method} ${req.originalUrl}]:`, {
    message: err.message,
    code: err.code,
    status: err.status || err.statusCode,
  });

  let status = err.status || err.statusCode || 500;
  let errorCode = err.errorCode || err.code || 'SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred. Please try again later.';

  // PostgreSQL specific error code translation
  if (err.code === '23505') {
    status = 409;
    errorCode = 'DUPLICATE_RECORD';
    message = 'A record with these details already exists.';
  } else if (err.code === '23503') {
    status = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'Referenced item was not found.';
  } else if (err.code === '22P02') {
    status = 400;
    errorCode = 'INVALID_DATA_TYPE';
    message = 'Invalid parameter or identifier format.';
  } else if (status === 500) {
    errorCode = 'INTERNAL_ERROR';
    message = 'A server error occurred. Please contact AgroRent support.';
  }

  return res.status(status).json({
    success: false,
    message,
    errorCode,
  });
}

