import './globals.css';

export const metadata = {
  title: 'ReportIt Admin',
  icons: {
    icon: '/logo-fix.png',
    shortcut: '/logo-fix.png',
    apple: '/logo-fix.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-fix.png" />
        <link rel="apple-touch-icon" href="/logo-fix.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
