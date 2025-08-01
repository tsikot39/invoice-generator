'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSession } from 'next-auth/react';
import { Settings, User, Building, Bell, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsContent() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Company settings
  const [companyName, setCompanyName] = useState('Your Company Name');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultDueDate, setDefaultDueDate] = useState('30');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Notification settings
  const [overdueReminders, setOverdueReminders] = useState(true);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();

          // Update company info
          setCompanyName(data.companyInfo.name);
          setCompanyAddress(data.companyInfo.address);
          setCompanyPhone(data.companyInfo.phone);
          setCompanyEmail(data.companyInfo.email);
          setCompanyWebsite(data.companyInfo.website);

          // Update invoice settings
          setInvoicePrefix(data.invoiceSettings.prefix);
          setDefaultDueDate(data.invoiceSettings.defaultDueDate.toString());
          setDefaultTaxRate(data.invoiceSettings.defaultTaxRate.toString());
          setTermsAndConditions(data.invoiceSettings.termsAndConditions);

          // Update notification settings
          setOverdueReminders(data.notifications.overdueReminders);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load settings. Using defaults.',
        });
      }
    };

    if (session?.user) {
      loadSettings();
    }
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const settingsData = {
        companyInfo: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          website: companyWebsite,
        },
        invoiceSettings: {
          prefix: invoicePrefix,
          defaultDueDate: parseInt(defaultDueDate),
          defaultTaxRate: parseFloat(defaultTaxRate),
          termsAndConditions,
        },
        notifications: {
          overdueReminders,
        },
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        toast.success('Settings saved successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = 'Failed to save settings. Please try again.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your application settings and preferences</p>
      </div>

      {message && (
        <div
          className={`flex items-center space-x-2 text-sm p-3 rounded-md ${
            message.type === 'success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={session?.user?.name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Profile information is managed through your Google account.
            </p>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
            <CardDescription>Information that appears on your invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  placeholder="company@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={e => setCompanyPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea
                id="companyAddress"
                value={companyAddress}
                onChange={e => setCompanyAddress(e.target.value)}
                placeholder="123 Business St, City, State 12345"
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Invoice Settings</span>
            </CardTitle>
            <CardDescription>Default settings for new invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDueDate">Default Due Date (days)</Label>
                <Input
                  id="defaultDueDate"
                  type="number"
                  min="1"
                  value={defaultDueDate}
                  onChange={e => setDefaultDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={defaultTaxRate}
                  onChange={e => setDefaultTaxRate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Default Terms and Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
                placeholder="Payment is due within 30 days..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Overdue Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when invoices become overdue
                </p>
              </div>
              <Switch checked={overdueReminders} onCheckedChange={setOverdueReminders} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
