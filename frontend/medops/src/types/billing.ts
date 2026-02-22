// src/types/billing.ts
export interface BillingCategory {
  id: number;
  name: string;
  code_prefix: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}
export interface BillingItem {
  id: number;
  category: number | null;
  category_name?: string;
  category_prefix?: string;
  code: string;
  name: string;
  description?: string | null;
  unit_price: number;
  unit_price_display?: string;
  currency: string;
  estimated_duration?: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface BillingItemInput {
  category?: number | null;
  code: string;
  name: string;
  description?: string | null;
  unit_price: number;
  currency?: string;
  estimated_duration?: number | null;
  sort_order?: number;
  is_active?: boolean;
}
export interface BillingCategoryInput {
  name: string;
  code_prefix: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}