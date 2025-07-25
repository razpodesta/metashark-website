import type { Metadata } from "next";
import { auth } from "@/auth";
import { getAllSubdomains } from "@/lib/subdomains";
import { rootDomain } from "@/lib/utils";
import { AdminDashboard } from "./dashboard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Admin Dashboard | ${rootDomain}`,
  description: `Manage subdomains for ${rootDomain}`,
};

/**
 * @description Página del panel de administración.
 */
export default async function AdminPage() {
  console.log("[AdminPage] Renderizando la página de administración.");
  const session = await auth();
  if (!session?.user) {
    console.log("[AdminPage] Usuario no autenticado. Redirigiendo a /login.");
    redirect("/login");
  }
  console.log(`[AdminPage] Usuario autenticado: ${session.user.email}.`);

  const tenants = await getAllSubdomains();
  console.log(`[AdminPage] Se encontraron ${tenants.length} tenants.`);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard tenants={tenants} session={session} />
    </div>
  );
}
/* MEJORAS PROPUESTAS
* 1. **Streaming con Suspense:** Envolver `AdminDashboard` en `<Suspense>` con un esqueleto de carga para mejorar la experiencia de usuario mientras `getAllSubdomains` se resuelve.
* 2. **Manejo de Errores de Carga de Datos:** Añadir un `try/catch` alrededor de `getAllSubdomains` y mostrar un mensaje de error amigable en la UI si la conexión a Redis falla.
 * 1. **Streaming con Suspense:** Envolver `AdminDashboard` en un `<Suspense>` con un `fallback` (ej. un esqueleto de carga) para mejorar la percepción de velocidad mientras se carga `getAllSubdomains`.
 * 2. **Paginación de Datos:** Si la cantidad de tenants crece mucho, implementar paginación en `getAllSubdomains` y pasar los parámetros de página desde esta página.
 * 3. **Server-Side-Props específicos de Rol:** Si se introducen roles, la data que se obtiene aquí (`getAllSubdomains`) podría variar según el rol del usuario en la sesión.
 */
