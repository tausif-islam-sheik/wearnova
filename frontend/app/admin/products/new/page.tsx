"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { useAdminLoading, FormPageSkeleton } from "@/components/admin/PageSkeletons";

export default function NewProductPage() {
  const loading = useAdminLoading();
  if (loading) return <FormPageSkeleton />;
  return <ProductForm />;
}
