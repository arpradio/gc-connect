import './globals.css';
import type { ReactNode, FC } from 'react';
import Script from 'next/script';
import Header from '@/components/header';
import MusicPlayerFooter from '@/components/footer';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppProviders } from './providers/AppProviders';

export const metadata = {
  title: 'CIP-60 Music Tokens',
  description: 'A CIP-60 music token minting and explorer application',
} as const;

type RootLayoutProps = {
  readonly children: ReactNode;
};

const RootLayout: FC<RootLayoutProps> = ({ children }): React.ReactElement => (
  <html lang="en" className="overflow-hidden">
    <head>
      <Script
        src="https://cdn.jsdelivr.net/npm/@gamechanger-finance/gc/dist/browser.min.js"
        strategy="beforeInteractive"
      />
    </head>
    <body className="flex flex-col h-screen overflow-hidden bg-[#06080c]">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-2/3 h-1/3 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-2/3 h-1/3 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      <AppProviders>
        <Header />
        <div className="flex-1 pt-20 pb-20 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
              <main className="w-full max-w-6xl mx-auto px-4 sm:px-6">
                <div className="bg-slate-900/90 backdrop-blur-md rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400" />
                  <div className="p-4 sm:p-6 md:p-8 border border-t-0 border-slate-700/50">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </ScrollArea>
        </div>
        <MusicPlayerFooter />
      </AppProviders>
    </body>
  </html>
);

export default RootLayout;
