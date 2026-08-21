import { supabase } from '@/lib/supabase';
import type { Comanda, ComandaItem, Product } from '@/types/database';

export function itemsTotal(items: Pick<ComandaItem, 'price' | 'qty'>[]): number {
  return items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
}

export async function fetchProducts(restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('category')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) })) as Product[];
}

export async function fetchComandaItems(comandaId: string): Promise<ComandaItem[]> {
  const { data, error } = await supabase
    .from('comanda_items')
    .select('*')
    .eq('comanda_id', comandaId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) })) as ComandaItem[];
}

export async function getOpenCustomerComanda(
  restaurantId: string,
  customerId: string,
): Promise<Comanda | null> {
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('customer_id', customerId)
    .eq('status', 'aberta')
    .maybeSingle();
  if (error) throw error;
  return data as Comanda | null;
}

export async function openCustomerComanda(
  restaurantId: string,
  customerId: string,
  tableLabel: string,
): Promise<Comanda> {
  const existing = await getOpenCustomerComanda(restaurantId, customerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('comandas')
    .insert({
      restaurant_id: restaurantId,
      customer_id: customerId,
      opened_by: customerId,
      table_label: tableLabel.trim() || 'Balcão',
      status: 'aberta',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Comanda;
}

export async function openStaffComanda(
  restaurantId: string,
  staffId: string,
  tableLabel: string,
): Promise<Comanda> {
  const { data, error } = await supabase
    .from('comandas')
    .insert({
      restaurant_id: restaurantId,
      opened_by: staffId,
      table_label: tableLabel.trim() || 'Balcão',
      status: 'aberta',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Comanda;
}

export async function addOrBumpItem(params: {
  comandaId: string;
  product: Product;
  notes?: string;
}): Promise<void> {
  const notes = params.notes?.trim() || null;

  let findQuery = supabase
    .from('comanda_items')
    .select('*')
    .eq('comanda_id', params.comandaId)
    .eq('product_id', params.product.id);

  findQuery = notes ? findQuery.eq('notes', notes) : findQuery.is('notes', null);

  const { data: existing, error: findError } = await findQuery.maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from('comanda_items')
      .update({ qty: existing.qty + 1 })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('comanda_items').insert({
    comanda_id: params.comandaId,
    product_id: params.product.id,
    name: params.product.name,
    price: params.product.price,
    qty: 1,
    notes,
  });
  if (error) throw error;
}

export async function setItemQty(itemId: string, qty: number): Promise<void> {
  if (qty <= 0) {
    const { error } = await supabase.from('comanda_items').delete().eq('id', itemId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('comanda_items').update({ qty }).eq('id', itemId);
  if (error) throw error;
}

export async function cancelComanda(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('comandas')
    .update({ status: 'cancelada', cancel_reason: reason.trim() || 'Sem motivo informado' })
    .eq('id', id)
    .eq('status', 'aberta');
  if (error) throw error;
}

export async function finalizeComanda(id: string): Promise<void> {
  const { error } = await supabase
    .from('comandas')
    .update({ status: 'finalizada' })
    .eq('id', id)
    .eq('status', 'aberta');
  if (error) throw error;
}

export async function fetchStaffComandas(restaurantId: string, status: Comanda['status']): Promise<Comanda[]> {
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Comanda[];
}

export async function fetchComanda(id: string): Promise<Comanda | null> {
  const { data, error } = await supabase.from('comandas').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Comanda | null;
}
