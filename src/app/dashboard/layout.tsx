export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="dashboard-shell min-h-screen">{children}</div>;
}
