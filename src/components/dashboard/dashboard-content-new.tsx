'use client';

import React from 'react';
import { Invoice } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboard } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils-invoice';
import { DollarSign, FileText, Clock, AlertTriangle, Eye, Plus, Package } from 'lucide-react';
import Link from 'next/link';

export function DashboardContent() {
  const { data: stats, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Unable to load dashboard data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available.</p>
        </CardContent>
      </Card>
    );
  }

  // Process invoice status data with aggressive deduplication
  const processedStatuses = (() => {
    const statusCounts = new Map<string, { count: number; displayName: string }>();

    // Process the data from API
    const rawData = stats.invoicesByStatus || [];

    // Convert array format to normalized data
    (Array.isArray(rawData) ? rawData : []).forEach(item => {
      if (
        item &&
        typeof item === 'object' &&
        item.status &&
        typeof item.count === 'number' &&
        item.count > 0
      ) {
        const normalizedKey = item.status.toString().toLowerCase().trim().replace(/\s+/g, '');
        const displayName =
          item.status.toString().charAt(0).toUpperCase() +
          item.status.toString().slice(1).toLowerCase();

        if (statusCounts.has(normalizedKey)) {
          const existing = statusCounts.get(normalizedKey)!;
          statusCounts.set(normalizedKey, {
            count: existing.count + item.count,
            displayName: existing.displayName,
          });
        } else {
          statusCounts.set(normalizedKey, {
            count: item.count,
            displayName: displayName,
          });
        }
      }
    });

    return Array.from(statusCounts.values());
  })();

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your latest invoice activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentInvoices && stats.recentInvoices.length > 0 ? (
                (stats.recentInvoices as Array<Invoice & { _id: string }>).map(invoice => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'sent'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>
                      <Link href={`/invoices/${invoice._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Link href="/invoices">
              <Button variant="outline">View All Invoices</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Status Overview and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Breakdown</CardTitle>
            <CardDescription>Current status of all your invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {processedStatuses.length > 0 ? (
              processedStatuses.map(status => (
                <div key={status.displayName} className="flex items-center justify-between">
                  <Badge variant="outline">{status.displayName}</Badge>
                  <span className="font-medium">{status.count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No invoice data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/invoices/new">
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Invoice
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Create New Product
              </Button>
            </Link>
            <Link href="/invoices?status=overdue">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Overdue Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
