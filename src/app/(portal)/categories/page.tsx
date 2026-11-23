import type { Metadata } from "next";
import { CategoriesManager } from "@/components/categories/categories-manager";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Manage Japaika storefront categories, subcategories, imagery, and visibility.",
};

export default function CategoriesPage() {
  return <CategoriesManager />;
}
