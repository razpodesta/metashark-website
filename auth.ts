import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

/**
 * @description Simulación de una base de datos de usuarios con contraseña hasheada.
 * En un entorno real, el hash se generaría al registrar el usuario y se almacenaría en la BD.
 * El hash de ejemplo corresponde a "password123".
 */
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@metashark.co",
    // Hash generado con: await bcrypt.hash("password123", 10)
    passwordHash:
      "$2b$10$wOK.gI9lI/j9sE0b2l0kKeO1k.VjX3XbWdG1u.S2QxG2U2Y5eWwIq",
    name: "Metashark Admin",
  },
];

/**
 * @description Configuración principal de Auth.js, incluyendo los proveedores de autenticación.
 * Exporta los `handlers` (GET, POST), y las funciones `auth`, `signIn`, y `signOut`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      /**
       * @description Lógica para autorizar a un usuario basado en las credenciales proporcionadas.
       * @param {Partial<Record<string, unknown>>} credentials - Las credenciales del formulario de login.
       * @returns {Promise<User | null>} - El objeto de usuario si la autenticación es exitosa, o `null`.
       */
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = MOCK_USERS.find((u) => u.email === credentials.email);
        if (!user) {
          // No se encontró el usuario.
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (passwordsMatch) {
          const { passwordHash, ...userWithoutPassword } = user;
          return userWithoutPassword; // Autenticación exitosa
        }

        return null; // La contraseña no coincide
      },
    }),
  ],
});
/* MEJORAS PROPUESTAS
 * 1. **Seguridad Crítica:** Reemplazar la comparación de contraseñas en texto plano por `bcrypt.compare`. La contraseña del usuario en la base de datos debe estar hasheada.
 * 2. **Base de Datos Real:** Conectar esto a una base de datos real (PostgreSQL, MongoDB, etc.) en lugar de `MOCK_USERS`.
 * 3. **Múltiples Proveedores:** Añadir proveedores de OAuth como Google, GitHub o LinkedIn para ofrecer más opciones de inicio de sesión.
 * 4. **Tipos de Sesión:** Definir tipos más estrictos para el objeto `User` y `Session` en un archivo `types/next-auth.d.ts` para mejorar el autocompletado y la seguridad de tipos.
 */
