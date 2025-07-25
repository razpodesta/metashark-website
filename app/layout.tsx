// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metashark",
  description: "Multi-tenant SaaS platform by Metashark",
};

// NOTA: Aunque este layout es asíncrono, NO usa `await params` porque
// solo reenvía los `children`. El `locale` se extrae de la firma
// para pasarlo a la etiqueta `<html>`.
export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
/* MEJORAS PROPUESTAS
 * 1. **SessionProvider:** Envolver `children` con el `SessionProvider` de `next-auth/react`. Es la mejor práctica para dar acceso reactivo a la sesión a los Componentes de Cliente sin necesidad de pasar props.
 * 2. **Layouts de UI Anidados:** Para añadir una barra lateral al admin, ahora puedes crear de forma segura un archivo `app/admin/layout.tsx` que contenga solo los componentes de la UI (Header, Sidebar, etc.) y envuelva a `{children}`.
 */
