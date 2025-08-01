import { useState, useEffect, useCallback } from "react";
import { Client, Product, Invoice } from "@/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Generic hook for API calls
export function useApi<T>(url: string, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, refreshTrigger, ...deps]);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return { data, loading, error, refetch };
}

// Clients hooks
export function useClients(search?: string, page = 1, limit = 10) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return useApi<{ clients: Client[]; pagination: Pagination }>(
    `/api/clients?${params}`,
    [search, page, limit]
  );
}

export function useClient(id: string) {
  return useApi<{ client: Client }>(`/api/clients/${id}`, [id]);
}

// Products hooks
export function useProducts(
  search?: string,
  category?: string,
  page = 1,
  limit = 10
) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return useApi<{ products: Product[]; pagination: Pagination }>(
    `/api/products?${params}`,
    [search, category, page, limit]
  );
}

export function useProduct(id: string) {
  return useApi<{ product: Product }>(`/api/products/${id}`, [id]);
}

// Invoices hooks
export function useInvoices(
  search?: string,
  status?: string,
  clientId?: string,
  page = 1,
  limit = 10
) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (clientId) params.append("clientId", clientId);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return useApi<{ invoices: Invoice[]; pagination: Pagination }>(
    `/api/invoices?${params}`,
    [search, status, clientId, page, limit]
  );
}

export function useInvoice(id: string) {
  return useApi<{ invoice: Invoice }>(`/api/invoices/${id}`, [id]);
}

// Dashboard hook
export function useDashboard() {
  return useApi<{
    totalInvoices: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    recentInvoices: Invoice[];
    invoicesByStatus: Record<string, number>;
    monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  }>("/api/dashboard");
}

// Mutation hooks
export function useMutation<T, TVariables = Record<string, unknown>>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string,
    options: RequestInit,
    variables?: TVariables
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: variables ? JSON.stringify(variables) : options.body,
      });

      const result: ApiResponse<T> = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.message);
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// Specific mutation hooks
export function useCreateClient() {
  const { mutate, loading, error } = useMutation<{ client: Client }>();

  const createClient = (data: Partial<Client>) =>
    mutate("/api/clients", { method: "POST" }, data);

  return { createClient, loading, error };
}

export function useUpdateClient() {
  const { mutate, loading, error } = useMutation<{ client: Client }>();

  const updateClient = (id: string, data: Partial<Client>) =>
    mutate(`/api/clients/${id}`, { method: "PUT" }, data);

  return { updateClient, loading, error };
}

export function useDeleteClient() {
  const { mutate, loading, error } = useMutation<null>();

  const deleteClient = (id: string) =>
    mutate(`/api/clients/${id}`, { method: "DELETE" });

  return { deleteClient, loading, error };
}

export function useCreateProduct() {
  const { mutate, loading, error } = useMutation<{ product: Product }>();

  const createProduct = (data: Partial<Product>) =>
    mutate("/api/products", { method: "POST" }, data);

  return { createProduct, loading, error };
}

export function useUpdateProduct() {
  const { mutate, loading, error } = useMutation<{ product: Product }>();

  const updateProduct = (id: string, data: Partial<Product>) =>
    mutate(`/api/products/${id}`, { method: "PUT" }, data);

  return { updateProduct, loading, error };
}

export function useDeleteProduct() {
  const { mutate, loading, error } = useMutation<null>();

  const deleteProduct = (id: string) =>
    mutate(`/api/products/${id}`, { method: "DELETE" });

  return { deleteProduct, loading, error };
}

export function useCreateInvoice() {
  const { mutate, loading, error } = useMutation<{ invoice: Invoice }>();

  const createInvoice = (data: Partial<Invoice>) =>
    mutate("/api/invoices", { method: "POST" }, data);

  return { createInvoice, loading, error };
}

export function useUpdateInvoice() {
  const { mutate, loading, error } = useMutation<{ invoice: Invoice }>();

  const updateInvoice = (id: string, data: Partial<Invoice>) =>
    mutate(`/api/invoices/${id}`, { method: "PUT" }, data);

  return { updateInvoice, loading, error };
}

export function useDeleteInvoice() {
  const { mutate, loading, error } = useMutation<null>();

  const deleteInvoice = (id: string) =>
    mutate(`/api/invoices?id=${id}`, { method: "DELETE" });

  return { deleteInvoice, loading, error };
}

// Hook to check and update overdue invoices
export function useCheckOverdueInvoices() {
  const { mutate, loading, error } = useMutation<{
    message: string;
    updatedCount: number;
    invoiceIds: string[];
  }>();

  const checkOverdue = () =>
    mutate("/api/invoices/check-overdue", { method: "POST" });

  return { checkOverdue, loading, error };
}

// Hook to send overdue reminders
export function useSendOverdueReminders() {
  const { mutate, loading, error } = useMutation<{
    success: boolean;
    message: string;
    summary?: {
      total: number;
      sent: number;
      skipped: number;
      errors: number;
    };
    results?: Array<{
      invoiceId: string;
      invoiceNumber: string;
      success?: boolean;
      error?: string;
      skipped?: boolean;
    }>;
  }>();

  const sendReminders = (invoiceId?: string) =>
    mutate(
      "/api/overdue-reminders",
      { method: "POST" },
      {
        invoiceId,
        manualTrigger: true,
      }
    );

  const sendAllReminders = () =>
    mutate(
      "/api/overdue-reminders",
      { method: "POST" },
      {
        manualTrigger: true,
      }
    );

  return { sendReminders, sendAllReminders, loading, error };
}
