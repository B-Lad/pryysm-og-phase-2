import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { WorkspaceProvider } from '@/hooks/use-workspace';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pryysm by 3D Prodigy',
  description: '3D Printing Farm Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
            <Toaster />
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
