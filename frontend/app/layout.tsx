import { Providers } from './providers';

export const metadata = {
  title: 'UNQ Academic Credentials',
  description: 'Sistema de credenciales académicas verificables en blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
