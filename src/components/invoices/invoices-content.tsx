"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useInvoices,
  useDeleteInvoice,
  useSendOverdueReminders,
  useCheckOverdueInvoices,
} from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils-invoice";
import { downloadInvoicePDF } from "@/lib/pdf-generator";
import {
  Plus,
  Search,
  Edit,
  Eye,
  FileText,
  Download,
  Filter,
  Trash2,
  Send,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusUpdateDropdown } from "./status-update-dropdown";

export function InvoicesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [hasCheckedOverdue, setHasCheckedOverdue] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Initialize status from URL parameters
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (
      urlStatus &&
      ["draft", "sent", "paid", "overdue", "void"].includes(urlStatus)
    ) {
      setStatus(urlStatus);
      // Reset overdue check flag when status changes
      setHasCheckedOverdue(urlStatus !== "overdue");
    } else {
      // No status parameter means "all" - reset overdue check flag
      setStatus("all");
      setHasCheckedOverdue(true);
    }
  }, [searchParams]);

  const { data, loading, error, refetch } = useInvoices(
    search,
    status === "all" ? "" : status,
    undefined,
    page,
    10
  );

  const { deleteInvoice } = useDeleteInvoice();
  const { sendAllReminders, loading: sendingReminders } =
    useSendOverdueReminders();
  const { checkOverdue, loading: checkingOverdue } = useCheckOverdueInvoices();

  // Check for overdue invoices when status changes to overdue
  useEffect(() => {
    if (status === "overdue" && !hasCheckedOverdue) {
      const checkAndRefresh = async () => {
        try {
          setHasCheckedOverdue(true);
          await checkOverdue();
          // Wait a bit for the database update to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
          refetch();
        } catch (error) {
          console.error("Failed to check overdue invoices:", error);
          // Still refetch even if check fails
          refetch();
        }
      };

      checkAndRefresh();
    }
  }, [status, hasCheckedOverdue, checkOverdue, refetch]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    // Reset overdue check flag when manually changing status
    setHasCheckedOverdue(newStatus !== "overdue");
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteInvoice(id);
      // Refresh the invoice list after successful deletion
      refetch();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      alert("Failed to delete invoice. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      setDownloadingId(invoiceId);

      // Fetch complete invoice data including client information
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice data");
      }

      const { data: responseData } = await response.json();
      const invoice = responseData.invoice;

      if (!invoice.client) {
        throw new Error("Client information not found for this invoice");
      }

      // Company info - you can make this configurable later
      const companyInfo = {
        name: "Your Company Name",
        address: "123 Business St, City, State 12345",
        phone: "(555) 123-4567",
        email: "contact@yourcompany.com",
        website: "www.yourcompany.com",
      };

      // Generate and download PDF
      downloadInvoicePDF({
        invoice,
        client: invoice.client,
        companyInfo,
      });
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendInvoice = async (invoice: {
    id: string;
    client?: { email?: string };
  }) => {
    if (!invoice.client?.email) {
      toast.error(
        "Client email not found. Please add an email address to the client."
      );
      return;
    }

    setSendingId(invoice.id);

    try {
      const response = await fetch("/api/email-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Invoice sent successfully to ${invoice.client.email}`);
        // Refresh the data to show updated status
        refetch();
      } else {
        toast.error(data.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Failed to send invoice:", error);
      toast.error("Failed to send invoice. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  const handleSendAllReminders = async () => {
    setShowReminderModal(true);
  };

  const confirmSendReminders = async () => {
    setShowReminderModal(false);

    try {
      const result = await sendAllReminders();
      if (result?.summary) {
        const { sent, skipped, errors } = result.summary;
        toast.success(
          `Reminders processed: ${sent} sent, ${skipped} skipped, ${errors} errors`
        );
      } else {
        toast.success("Overdue reminders sent successfully");
      }
    } catch (error) {
      console.error("Failed to send reminders:", error);
      toast.error("Failed to send reminders. Please try again.");
    }
  };

  if (loading || checkingOverdue) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Error loading invoices</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const invoices = data?.invoices || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Create and manage your invoices
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSendAllReminders}
            disabled={sendingReminders}
            className="cursor-pointer"
          >
            {sendingReminders ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Send Overdue Reminders
              </>
            )}
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {status === "overdue"
              ? "Overdue Invoices"
              : status === "paid"
                ? "Paid Invoices"
                : status === "sent"
                  ? "Sent Invoices"
                  : status === "draft"
                    ? "Draft Invoices"
                    : status === "void"
                      ? "Void Invoices"
                      : "All Invoices"}
          </CardTitle>
          <CardDescription>
            {status === "overdue"
              ? "Invoices that are past their due date"
              : status === "paid"
                ? "Invoices that have been paid"
                : status === "sent"
                  ? "Invoices that have been sent to clients"
                  : status === "draft"
                    ? "Draft invoices ready to be sent"
                    : status === "void"
                      ? "Cancelled or void invoices"
                      : "A list of all your invoices and their status"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              {status === "overdue" ? (
                <>
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No overdue invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Great! You don&apos;t have any overdue invoices at the
                    moment.
                  </p>
                </>
              ) : status === "paid" ? (
                <>
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No paid invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No paid invoices found. Create and send invoices to get
                    paid.
                  </p>
                </>
              ) : status === "sent" ? (
                <>
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No sent invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No sent invoices found. Send your draft invoices to clients.
                  </p>
                </>
              ) : status === "draft" ? (
                <>
                  <Edit className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No draft invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No draft invoices found. Create a new invoice to get
                    started.
                  </p>
                </>
              ) : status === "void" ? (
                <>
                  <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No void invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No void invoices found.
                  </p>
                </>
              ) : search ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No results found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No invoices match your search &quot;{search}&quot;.
                  </p>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                    No invoices
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating your first invoice.
                  </p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/invoices/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Invoice
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {invoice.clientName || invoice.clientId}
                      </TableCell>
                      <TableCell>
                        <StatusUpdateDropdown
                          invoiceId={invoice.id}
                          invoiceNumber={invoice.invoiceNumber}
                          currentStatus={invoice.status}
                          onStatusUpdate={() => {
                            // Refetch data to get updated status
                            refetch();
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(invoice.issueDate))}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(invoice.dueDate))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            asChild
                          >
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            asChild
                          >
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(invoice.id)}
                            disabled={downloadingId === invoice.id}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={sendingId === invoice.id}
                            className="cursor-pointer disabled:cursor-not-allowed"
                            title="Send to Client"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(invoice.id, invoice.invoiceNumber)
                            }
                            disabled={deletingId === invoice.id}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, pagination.total)} of{" "}
                    {pagination.total} invoices
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal for Sending Reminders */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Send Overdue Reminders
            </DialogTitle>
            <DialogDescription>
              This will send email reminders to all clients with overdue
              invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              The emails will include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>A professional reminder message</li>
              <li>PDF attachment of the overdue invoice</li>
              <li>Payment instructions</li>
            </ul>
            <p className="mt-4 text-sm font-medium">
              Are you sure you want to proceed?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReminderModal(false)}
              disabled={sendingReminders}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSendReminders}
              disabled={sendingReminders}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {sendingReminders ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminders
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
