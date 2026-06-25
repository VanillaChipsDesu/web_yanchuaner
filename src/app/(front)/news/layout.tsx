import { requirePageAlumni } from "@/lib/admin-auth";
export const metadata = { robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePageAlumni();
  return children;
}
