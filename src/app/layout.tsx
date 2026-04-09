import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { GuestProvider } from "@/context/GuestContext";
import { ToastProvider } from "@/context/ToastContext";
import { TabBar } from "@/components/layout/TabBar";
import { MainWrapper } from "@/components/layout/MainWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodify",
  description: "Tu restaurante favorito en tus manos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Foodify",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <GuestProvider>
            <ThemeProvider>
              <ToastProvider>
                <MainWrapper>
                  {children}
                </MainWrapper>
                <TabBar pendingOrders={0} />
              </ToastProvider>
            </ThemeProvider>
          </GuestProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

