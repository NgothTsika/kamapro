import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/http";
import { HttpError } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";
import {
  loginWithApple,
  loginWithGoogle,
  loginWithEmail,
} from "./auth.service";

const authPayloadSchema = z.object({
  idToken: z.string().min(1),
  language: z.string().min(2).max(10).optional(),
});

const emailPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  language: z.string().min(2).max(10).optional(),
});

export const authRouter = Router();

authRouter.post(
  "/google",
  asyncHandler(async (req, res) => {
    const payload = authPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      throw new HttpError(400, "Invalid payload");
    }

    const { user, session } = await loginWithGoogle(
      payload.data.idToken,
      payload.data.language,
    );
    res.status(200).json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        language: user.language,
      },
    });
  }),
);

authRouter.post(
  "/email",
  asyncHandler(async (req, res) => {
    const payload = emailPasswordSchema.safeParse(req.body);
    if (!payload.success) {
      throw new HttpError(400, "Invalid email or password");
    }

    const { user, session } = await loginWithEmail(
      payload.data.email,
      payload.data.password,
      payload.data.language,
    );
    res.status(200).json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        language: user.language,
      },
    });
  }),
);

authRouter.post(
  "/apple",
  asyncHandler(async (req, res) => {
    const payload = authPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      throw new HttpError(400, "Invalid payload");
    }

    const { user, session } = await loginWithApple(
      payload.data.idToken,
      payload.data.language,
    );
    res.status(200).json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        language: user.language,
      },
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        language: true,
        xp: true,
        streak: true,
      },
    });

    res.status(200).json({ user });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.session.deleteMany({
      where: {
        token: req.sessionToken,
      },
    });

    res.status(204).send();
  }),
);
