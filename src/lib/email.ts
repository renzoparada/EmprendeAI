import "server-only";

/**
 * Envío de email mínimo, solo para recuperación de contraseña. Sin
 * RESEND_API_KEY configurada no se envía nada de verdad — se imprime el link
 * en consola. Mismo patrón que ANTHROPIC_API_KEY/CRON_SECRET: el resto de la
 * plataforma funciona sin configurar esto, pero nunca se finge un envío que
 * no ocurrió.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY no configurada. Link de recuperación para ${to}: ${resetUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM || "EMPRENDE AI <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Recupera tu contraseña — EMPRENDE AI",
      html: `<p>Recibimos una solicitud para restablecer tu contraseña en EMPRENDE AI.</p><p><a href="${resetUrl}">Hacé clic aquí para elegir una nueva contraseña</a>. Este link vence en 1 hora.</p><p>Si no fuiste vos, podés ignorar este correo — tu contraseña actual sigue funcionando.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo enviar el email de recuperación (${res.status}): ${body}`);
  }
}
