import AppLayout from "./_components/app-layout";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppLayout>{children}</AppLayout>;
}
