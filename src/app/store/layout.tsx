export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="dashboard-shell min-h-screen font-sans">{children}</div>;
}
