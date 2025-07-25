// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth"; // Importa el objeto `auth` de Auth.js v5
import createIntlMiddleware from "next-intl/middleware";
import { locales, pathnames, localePrefix } from "./navigation";

const intlMiddleware = createIntlMiddleware({
  locales,
  pathnames,
  localePrefix,
  defaultLocale: "en",
});

export default auth((request) => {
  // 1. Detección de Subdominio
  const host = request.headers.get("host") || "";
  const isSubdomain = (() => {
    if (host.includes("localhost")) {
      const parts = host.split(".");
      return (
        parts.length > 2 || (parts.length === 2 && parts[0] !== "localhost")
      );
    }
    return host.split(".").length > 2;
  })();

  if (isSubdomain) {
    const subdomain = host.split(".")[0];
    const url = request.nextUrl; // No es necesario clonar aquí
    console.log(
      `[Middleware] Subdominio detectado: '${subdomain}'. Reescribiendo a /s/${subdomain}${url.pathname}`
    );
    return NextResponse.rewrite(
      new URL(`/s/${subdomain}${url.pathname}`, request.url)
    );
  }

  // 2. Si no es un subdominio, pasa la petición al middleware de i18n.
  // La lógica de `authorized` en `auth.config.ts` ya se ejecutó por
  // el `auth` que envuelve esta función. Si llegamos aquí, el usuario
  // está autorizado para esta ruta.
  console.log(
    `[Middleware] Dominio principal y ruta autorizada. Ejecutando i18n middleware.`
  );
  return intlMiddleware(request);
});

// Configuración del Matcher
export const config = {
  // El matcher ahora incluye explícitamente las rutas de la aplicación
  // y excluye las que no necesitan procesamiento.
  matcher: [
    // Habilita el middleware para todas las rutas excepto las siguientes:
    "/((?!api|_next/static|_next/image|assets|favicon.ico).*)",
    // La ruta de la API de autenticación necesita ser manejada
    "/api/auth/:path*",
  ],
};
/* MEJORAS PROPUESTAS
 * 1. **Roles en Middleware:** Dentro de `authMiddleware`, una vez que `req.auth` contenga roles, se puede añadir lógica como: `if (pathnameWithoutLocale.startsWith('/admin') && req.auth.user.role !== 'admin') { ... }`.
 * 2. **Seguridad de Contraseñas:** En `auth.ts`, la prioridad número uno es reemplazar la comparación de contraseñas en texto plano por `bcrypt`. Se debe instalar (`pnpm add bcrypt @types/bcrypt`) y usar `bcrypt.hash` al crear usuarios y `bcrypt.compare` en la función `authorize`.
 * 1. **Roles en Middleware:** Dentro de `authMiddleware`, una vez que `req.auth` contenga roles, se puede añadir lógica como: `if (pathname.includes('/admin') && req.auth.user.role !== 'admin') { ... }`.
 * 2. **Manejo de Subdominios en Local:** La lógica actual para detectar subdominios en localhost es simple. Se puede mejorar para soportar URLs como `tenant.localhost:3000` de forma más fiable si es necesario.
 * 1. **Manejo de API:** Si se añaden rutas `/api`, se pueden añadir al matcher para excluirlas o manejarlas con un tipo de autenticación diferente (ej. API Key) dentro de este mismo middleware, antes de pasar a `intlMiddleware`.
 * 2. **Configuración de Dominio para i18n:** `next-intl` soporta configuración de dominios por idioma (ej. `metashark.com` para inglés y `metashark.es` para español), una estrategia avanzada para el futuro.
 * 1. **Rutas Públicas Explícitas:** En lugar de proteger todo bajo `/admin` por defecto, el `matcher` podría ser más granular para incluir/excluir rutas específicas, mejorando el rendimiento al no ejecutar el middleware donde no es necesario.
 * 2. **Redirección de `www`:** Añadir una lógica al principio del middleware para detectar `www` y hacer una redirección 301 a la versión sin `www` para una consistencia de SEO.
 * 3. **Manejo de API Key para Rutas API:** Si en el futuro se crean rutas de API (`/api/*`), se podría añadir una lógica que verifique un `Bearer token` en la cabecera `Authorization` para peticiones de API, coexistiendo con la autenticación de sesión para el frontend.
 * 1. **Manejo de www:** La lógica actual trata `www` como un subdominio nulo. Se podría añadir una redirección explícita de `www.metashark.co` a `metashark.co` para una mejor SEO.
 * 2. **Cacheo de Decisiones:** Para subdominios o usuarios con mucho tráfico, las decisiones del middleware (como la comprobación de sesión) podrían ser cacheadas brevemente en el edge para reducir la latencia.
 */
