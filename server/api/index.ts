/**
 * Vercel Serverless Function Handler
 *
 * This file wraps the Express app from src/index.ts as a Vercel serverless function.
 * Vercel calls this function with each incoming request.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../dist/src/index.js";

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
