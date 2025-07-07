import './globals.css';

export const metadata = {
  title: 'ReportIt Admin'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
