import { requirePageAdmin } from "@/lib/admin-auth";

export default async function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAdmin();
  return children;
}
