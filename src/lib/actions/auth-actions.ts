"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LIMIT_PER_EMAIL = 5;
const LOGIN_LIMIT_PER_IP = 20;

/**
 * `x-forwarded-for` lo pone el proveedor de hosting (ej. Vercel) delante de
 * cualquier valor que el cliente mande — en ese tipo de deploy no se puede
 * falsear. Es solo una capa extra sobre el límite por email (el que importa
 * para frenar brute-force contra una cuenta puntual): protege contra un
 * mismo origen probando contraseñas contra muchos emails distintos.
 */
async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function registerUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  return { success: true };
}

export async function loginUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const ip = await getClientIp();

  const [emailLimit, ipLimit] = await Promise.all([
    email
      ? checkRateLimit(`login-email:${email}`, LOGIN_LIMIT_PER_EMAIL, LOGIN_WINDOW_MS)
      : Promise.resolve({ allowed: true, retryAfterSeconds: 0 }),
    checkRateLimit(`login-ip:${ip}`, LOGIN_LIMIT_PER_IP, LOGIN_WINDOW_MS),
  ]);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryAfterMinutes = Math.ceil(Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds) / 60);
    return { error: `Demasiados intentos de inicio de sesión. Esperá ${retryAfterMinutes} minuto(s) e intenta de nuevo.` };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    // NEXT_REDIRECT y otros errores de control de flujo de Next.js deben propagarse.
    throw error;
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
