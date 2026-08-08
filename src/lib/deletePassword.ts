// Verificación de la contraseña para borrar partidas.
// Se guarda solo el hash SHA-256, no la contraseña en claro. Es un candado
// para evitar borrados accidentales o de graciosos con el móvil de otro,
// no seguridad real: el borrado sigue siendo una operación del cliente.
const DELETE_PASSWORD_SHA256 =
  "2229a6e91153c93937d23f26c5eb1eb497b91cacab98ee22c88c19d63338b7b0";

export async function verifyDeletePassword(password: string): Promise<boolean> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex === DELETE_PASSWORD_SHA256;
}
