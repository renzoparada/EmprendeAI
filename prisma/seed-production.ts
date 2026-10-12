/**
 * Seed de PRODUCCIÓN — a diferencia de `seed.ts` (datos demo para
 * desarrollo local), este script NUNCA crea usuarios ni empresas de
 * prueba. Su único trabajo es crear el primer usuario ADMIN a partir de
 * variables de entorno, para poder entrar al Panel Admin (spec §25) sin
 * tener que tocar la base de datos a mano.
 *
 * Requiere `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno. Si no están
 * configuradas, el script termina sin error — un seed de producción nunca
 * debe romper un deploy por esto, simplemente no crea nada todavía.
 *
 * Idempotente y pensado para correr en cada deploy sin riesgo: si ya existe
 * CUALQUIER usuario con rol ADMIN, no hace nada más — así un redeploy con
 * las mismas (o distintas) variables de entorno nunca puede pisar la
 * contraseña de un admin ya creado. Cambiar la contraseña de un admin
 * existente es, a propósito, una operación manual, no algo que un script de
 * seed pueda hacer solo con variables de entorno.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log(`Ya existe un usuario ADMIN (${existingAdmin.email}) — no se crea ni se modifica ninguno.`);
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD no están configuradas — no se crea ningún usuario admin todavía.");
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Si el email ya pertenece a una cuenta registrada por su cuenta (spec
  // §1, /register), se promueve a ADMIN sin tocar su contraseña — nunca se
  // pisa una contraseña que el usuario ya eligió.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { name: "Administrador", email, passwordHash, planCode: "BUSINESS", role: "ADMIN" },
  });

  console.log(`Usuario ADMIN listo: ${admin.email}. Iniciá sesión y guardá la contraseña en un lugar seguro.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
