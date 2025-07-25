"use server";

// --- IMPORTACIONES DE TERCEROS Y DE NEXT.JS ---
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// --- IMPORTACIONES INTERNAS DEL PROYECTO ---
import { redis } from "@/lib/redis";
import { protocol, rootDomain } from "@/lib/utils";

// --- ESQUEMAS DE VALIDACIÓN CON ZOD ---
const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

const SubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, { message: "El subdominio debe tener al menos 3 caracteres." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Solo se permiten letras minúsculas, números y guiones.",
    }),
  icon: z.string().min(1, { message: "El ícono es requerido." }),
});

// --- SERVER ACTIONS ---

/**
 * @description Maneja el inicio de sesión del usuario.
 * Esta acción tiene una firma que es compatible con el hook `useActionState`.
 * @param prevState - El estado anterior (inyectado por `useActionState`).
 * @param formData - Los datos del formulario.
 * @returns Un objeto que coincide con el tipo `LoginState` definido en el componente.
 */
export async function login(
  prevState: any,
  formData: FormData
): Promise<{ error?: string }> {
  const validatedFields = LoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.warn(
      "[Action:login] Validación de formulario fallida:",
      validatedFields.error.flatten().fieldErrors
    );
    return { error: "Los campos proporcionados son inválidos." };
  }

  const { email, password } = validatedFields.data;

  try {
    console.log(`[Action:login] Intentando iniciar sesión para: ${email}`);
    await signIn("credentials", { email, password, redirectTo: "/admin" });

    // Aunque `signIn` redirige y este código podría no alcanzarse,
    // es necesario para satisfacer el contrato de tipos de la función
    // y asegurar que siempre se devuelve un estado válido.
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(
        `[Action:login] Fallo de autenticación. Tipo: ${error.type}`
      );
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Las credenciales proporcionadas son incorrectas." };
        default:
          return { error: "Algo salió mal durante el inicio de sesión." };
      }
    }

    // Si el error no es de Auth.js, es un error inesperado, y debemos relanzarlo.
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
 * @description Crea un nuevo subdominio y lo guarda en Redis.
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
      ...Object.fromEntries(formData.entries()),
    };
  }

  const { subdomain, icon } = validatedFields.data;
  console.log(
    `[Action:createSubdomain] Intentando crear subdominio '${subdomain}' con ícono '${icon}'.`
  );

  const subdomainAlreadyExists = await redis.get(`subdomain:${subdomain}`);
  if (subdomainAlreadyExists) {
    console.warn(
      `[Action:createSubdomain] El subdominio '${subdomain}' ya existe.`
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

  revalidatePath("/[locale]/admin", "page");

  redirect(`${protocol}://${subdomain}.${rootDomain}`);
}

/**
 * @description Elimina un subdominio existente de Redis.
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
    console.error("[Action:deleteSubdomain] Subdominio inválido.");
    return { error: "Subdominio inválido." };
  }

  try {
    await redis.del(`subdomain:${subdomain}`);
    console.log(
      `[Action:deleteSubdomain] Subdominio '${subdomain}' eliminado.`
    );

    revalidatePath("/[locale]/admin", "page");
    return { success: "Subdominio eliminado correctamente." };
  } catch (error) {
    console.error(
      `[Action:deleteSubdomain] Error al eliminar '${subdomain}':`,
      error
    );
    return { error: "Error al eliminar el subdominio." };
  }
}
