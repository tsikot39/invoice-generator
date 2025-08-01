'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients, useCreateInvoice, useProducts } from '@/hooks/use-api';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: '',
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      total: 0,
    },
  ]);

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue' | 'void'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clientsData } = useClients();
  const { data: productsData } = useProducts('', '', 1, 100); // Get all products
  const createInvoice = useCreateInvoice();

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalTaxAmount = items.reduce((sum, item) => sum + (item.total * item.taxRate) / 100, 0);
  const grandTotal = subtotal + totalTaxAmount;

  // Handle item changes
  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };

    // Recalculate total for this item
    const item = newItems[index];
    item.total = item.quantity * item.unitPrice;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const selectProduct = (index: number, productId: string) => {
    const product = productsData?.products.find(p => p.id === productId);
    if (product) {
      updateItem(index, {
        productId: productId,
        name: product.name,
        description: product.description || '',
        unitPrice: product.unitPrice,
        taxRate: product.taxRate || 0,
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    console.log('Form submission started');

    try {
      if (!clientId) {
        throw new Error('Please select a client');
      }

      if (items.some(item => !item.productId || item.quantity <= 0)) {
        throw new Error('Please select a product for each item and ensure valid quantity');
      }

      const invoiceData = {
        clientId,
        invoiceNumber: `INV-${Date.now()}`, // Server will generate proper one
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          taxRate: item.taxRate,
        })),
        subtotal: subtotal,
        taxAmount: totalTaxAmount,
        total: grandTotal,
        status: status,
        notes: notes,
      };

      console.log('About to send invoice data:', invoiceData);

      await createInvoice.createInvoice(invoiceData);
      console.log('Invoice created successfully');
      onSuccess?.();
    } catch (err) {
      console.error('Invoice creation failed:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Client *</label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clientsData?.clients?.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Issue Date *</label>
              <Input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date *</label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <Select
              value={status}
              onValueChange={value =>
                setStatus(value as 'draft' | 'sent' | 'paid' | 'overdue' | 'void')
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Line Items
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              variant="outline"
              disabled={!productsData?.products?.length}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!productsData?.products?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No products available. Please create some products first to add them to invoices.
              </p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Product *</label>
                    <Select
                      value={item.productId || ''}
                      onValueChange={value => selectProduct(index, value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsData?.products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${product.unitPrice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {item.productId && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Selected Product</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e =>
                        updateItem(index, {
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Unit Price</label>
                    <Input
                      value={`$${item.unitPrice.toFixed(2)}`}
                      disabled
                      className="bg-gray-50"
                      title="Unit price is set from the selected product"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Line Total</label>
                    <Input value={`$${item.total.toFixed(2)}`} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.taxRate}
                      onChange={e =>
                        updateItem(index, {
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      title="Tax rate from product (can be adjusted per invoice)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax Amount</label>
                    <Input
                      value={`$${((item.total * item.taxRate) / 100).toFixed(2)}`}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${totalTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !productsData?.products?.length}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Invoice
        </Button>
      </div>
    </form>
  );
}
