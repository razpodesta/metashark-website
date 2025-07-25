"use server";

import { signIn, signOut } from "@/auth";
import { redis } from "@/lib/redis";
import { protocol, rootDomain } from "@/lib/utils";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Esquema de validación para el formulario de login
const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

// Esquema de validación para la creación de subdominios
const SubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, { message: "El subdominio debe tener al menos 3 caracteres." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Solo se permiten letras minúsculas, números y guiones.",
    }),
  icon: z.string().min(1, { message: "El ícono es requerido." }),
});

/**
 * @description Maneja el inicio de sesión del usuario.
 */
export async function login(formData: FormData) {
  try {
    const validatedFields = LoginSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      console.warn(
        "[Action:login] Validación fallida:",
        validatedFields.error.flatten().fieldErrors
      );
      // En una implementación real con `useActionState`, devolverías un objeto de error aquí.
      // Por ahora, el error se maneja en el bloque catch de AuthError.
      return;
    }

    console.log(
      `[Action:login] Intentando iniciar sesión para el usuario: ${validatedFields.data.email}`
    );
    await signIn("credentials", formData);
    console.log(
      `[Action:login] Inicio de sesión exitoso para: ${validatedFields.data.email}`
    );
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(
        `[Action:login] Fallo de autenticación. Tipo: ${error.type}`
      );
      // Aquí puedes mapear `error.type` a mensajes amigables para el usuario.
      // Por ejemplo, "CredentialsSignin" significa credenciales incorrectas.
      return; // Retorna para que la página de login pueda mostrar un error.
    }
    console.error(
      `[Action:login] Ocurrió un error inesperado durante el login:`,
      error
    );
    throw error;
  }
}

/**
 * @description Cierra la sesión del usuario actual.
 */
export async function logout() {
  console.log("[Action:logout] Intentando cerrar sesión.");
  try {
    await signOut();
    console.log("[Action:logout] Cierre de sesión completado.");
  } catch (error) {
    console.error("[Action:logout] Error al cerrar sesión:", error);
  }
}

/**
 * @description Crea un nuevo subdominio.
 */
export async function createSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = SubdomainSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.warn(
      "[Action:createSubdomain] Validación fallida:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: Object.values(validatedFields.error.flatten().fieldErrors).join(
        ", "
      ),
      ...Object.fromEntries(formData.entries()), // Devuelve los valores para repoblar el formulario
    };
  }

  const { subdomain, icon } = validatedFields.data;
  console.log(
    `[Action:createSubdomain] Intentando crear subdominio '${subdomain}' con ícono '${icon}'.`
  );

  const subdomainAlreadyExists = await redis.get(`subdomain:${subdomain}`);
  if (subdomainAlreadyExists) {
    console.warn(
      `[Action:createSubdomain] Intento fallido: El subdominio '${subdomain}' ya existe.`
    );
    return {
      error: "Este subdominio ya está en uso.",
      subdomain,
      icon,
    };
  }

  await redis.set(`subdomain:${subdomain}`, {
    emoji: icon,
    createdAt: Date.now(),
  });
  console.log(
    `[Action:createSubdomain] Subdominio '${subdomain}' creado exitosamente.`
  );
  revalidatePath("/[locale]/admin", "page"); // Invalida el caché de la página de admin
  redirect(`${protocol}://${subdomain}.${rootDomain}`);
}

/**
 * @description Elimina un subdominio existente.
 */
export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get("subdomain");
  console.log(
    `[Action:deleteSubdomain] Intentando eliminar el subdominio: ${subdomain}`
  );

  if (typeof subdomain !== "string" || !subdomain) {
    console.error(
      "[Action:deleteSubdomain] Intento de eliminación fallido: No se proporcionó un subdominio válido."
    );
    return { error: "Subdominio inválido." };
  }

  try {
    const result = await redis.del(`subdomain:${subdomain}`);
    if (result > 0) {
      console.log(
        `[Action:deleteSubdomain] Subdominio '${subdomain}' eliminado exitosamente de Redis.`
      );
    } else {
      console.warn(
        `[Action:deleteSubdomain] El subdominio '${subdomain}' no fue encontrado en Redis para eliminar.`
      );
    }
    revalidatePath("/[locale]/admin", "page");
    return { success: "Subdominio eliminado correctamente." };
  } catch (error) {
    console.error(
      `[Action:deleteSubdomain] Error al eliminar el subdominio '${subdomain}':`,
      error
    );
    return { error: "Error al eliminar el subdominio." };
  }
}
