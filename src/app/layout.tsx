import './globals.css';


export const metadata = {
  title: 'CIP-60 Music Token Minting',
  description: 'A CIP-60 music token minting application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body>{children}</body>
    </html>
  );
}