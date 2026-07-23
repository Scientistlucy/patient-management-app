import type { Response } from "express";

export function ok<T>(res: Response, data: T, message = "success", code = 200) {
  return res.status(code).json({ message, success: true, code, data });
}

export function fail(res: Response, message: string, code = 400, data: unknown = null) {
  return res.status(code).json({ message, success: false, code, data });
}
