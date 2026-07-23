export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="font-sans min-h-screen">{children}</div>;
}
