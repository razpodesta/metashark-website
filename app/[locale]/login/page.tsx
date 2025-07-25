import { useTranslations } from "next-intl";
import { login } from "@/app/actions";

/**
 * @description Formulario de inicio de sesión. Utiliza una Server Action para manejar el envío.
 */
function LoginForm() {
  const t = useTranslations("LoginPage");

  return (
    <form
      action={login}
      className="flex flex-col gap-4 p-8 bg-white shadow-md rounded-lg"
    >
      <h2 className="text-2xl font-bold text-center">{t("title")}</h2>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          defaultValue="admin@metashark.co"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          defaultValue="password123"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {t("signInButton")}
      </button>
    </form>
  );
}

/**
 * @description Página que renderiza el formulario de inicio de sesión.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}

/* MEJORAS PROPUESTAS
 * 1. **Feedback de Errores:** Implementar `useActionState` para mostrar un mensaje de "Credenciales incorrectas" al usuario directamente en el formulario si el login falla.
 * 2. **Social Logins:** Añadir botones para iniciar sesión con proveedores OAuth (Google, GitHub) para una mejor experiencia de usuario.
 * 1. **Manejo de Errores en UI:** Modificar la Server Action `login` y usar `useActionState` en `LoginForm` para mostrar mensajes de error específicos (ej. "Credenciales inválidas") directamente en el formulario.
 * 2. **Enlace "Olvidé mi contraseña":** Añadir un enlace que dirija a un flujo de recuperación de contraseña.
 * 3. **Botones de OAuth:** Integrar botones para iniciar sesión con Google, GitHub, etc., debajo del formulario de credenciales.
 */
