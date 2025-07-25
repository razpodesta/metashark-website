"use client";

import type { Session } from "next-auth";
import { useActionState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import Link from "next/link";
import { Trash2, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSubdomainAction, logout } from "@/app/actions";
import { rootDomain, protocol } from "@/lib/utils";

type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
};

type DeleteState = {
  error?: string;
  success?: string;
};

/**
 * @description Cabecera del dashboard que muestra información del usuario y acciones.
 * @param {object} props - Propiedades del componente.
 * @param {Session} props.session - El objeto de sesión del usuario.
 */
function DashboardHeader({ session }: { session: Session }) {
  const t = useTranslations("AdminDashboard");
  const username = session.user?.name || "User";

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">{t("headerTitle")}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {t("welcomeMessage", { username })}
        </span>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            {t("signOutButton")}
          </Button>
        </form>
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>
    </div>
  );
}

/**
 * @description Rejilla que muestra todos los tenants (subdominios) existentes.
 * @param {object} props - Propiedades del componente.
 */
function TenantGrid({
  tenants,
  action,
  isPending,
}: {
  tenants: Tenant[];
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  const t = useTranslations("AdminDashboard");
  const format = useFormatter();

  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">{t("noSubdomains")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenants.map((tenant) => (
        <Card key={tenant.subdomain}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{tenant.subdomain}</CardTitle>
              <form action={action}>
                <input
                  type="hidden"
                  name="subdomain"
                  value={tenant.subdomain}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  disabled={isPending}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl">{tenant.emoji}</div>
              <div className="text-sm text-gray-500">
                {t("created")}:{" "}
                {format.dateTime(new Date(tenant.createdAt), "short")}
              </div>
            </div>
            <div className="mt-4">
              <a
                href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                {t("visitSubdomain")}
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * @description Componente principal del dashboard de administración.
 * @param {object} props - Propiedades del componente.
 */
export function AdminDashboard({
  tenants,
  session,
}: {
  tenants: Tenant[];
  session: Session;
}) {
  const [state, action, isPending] = useActionState<DeleteState, FormData>(
    deleteSubdomainAction,
    {}
  );

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader session={session} />
      <TenantGrid tenants={tenants} action={action} isPending={isPending} />
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {state.success}
        </div>
      )}
    </div>
  );
}
/* MEJORAS PROPUESTAS
 * 1. **Componente de Notificaciones (Toast):** Reemplazar los `div` fijos de éxito/error por un sistema de notificaciones "toast" más robusto y estético, como `react-hot-toast` o el componente Toast de Shadcn/UI.
 * 2. **Búsqueda y Filtros:** Añadir un campo de búsqueda y filtros (ej. por fecha de creación) en el `DashboardHeader` para gestionar la `TenantGrid`.
 * 3. **Confirmación de Borrado:** Al hacer clic en el botón de eliminar, mostrar un modal de confirmación (`Dialog` de Shadcn/UI) para prevenir borrados accidentales.
 */
