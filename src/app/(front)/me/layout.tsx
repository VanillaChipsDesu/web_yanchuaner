import { requirePageUser } from "@/lib/admin-auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageUser();
  return children;
}
