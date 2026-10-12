"use server";

/**
 * Recuperación y cambio de contraseña (spec §25). Dos flujos distintos:
 * - Sin sesión ("olvidé mi contraseña"): requestPasswordReset + resetPassword,
 *   con un token de un solo uso enviado por email.
 * - Con sesión (desde Perfil): changePassword, exige la contraseña actual.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/actions/guard";
import { sendPasswordResetEmail } from "@/lib/email";
import type { ActionState } from "@/lib/actions/auth-actions";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const requestResetSchema = z.object({ email: z.string().email("Ingresa un email válido") });

/**
 * Siempre devuelve éxito, exista o no la cuenta — si confirmara cuáles
 * emails están registrados, cualquiera podría usar este formulario para
 * enumerarlos.
 */
export async function requestPasswordReset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ingresa un email válido." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    // Un solo token activo por usuario: los pedidos anteriores sin usar quedan inválidos.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    await sendPasswordResetEmail(user.email, `${baseUrl}/restablecer?token=${rawToken}`);
  }

  return { success: true };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Las contraseñas no coinciden", path: ["confirmPassword"] });

export async function resetPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: "Este link de recuperación venció o ya se usó. Solicita uno nuevo." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return { success: true };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: "Las contraseñas nuevas no coinciden", path: ["confirmPassword"] });

export async function changePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "La contraseña actual es incorrecta." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}
