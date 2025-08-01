'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useClient } from '@/hooks/use-api';
import { EditClientForm } from './edit-client-form';

interface EditClientContentProps {
  clientId: string;
}

export function EditClientContent({ clientId }: EditClientContentProps) {
  const router = useRouter();
  const { data: clientData, loading, error } = useClient(clientId);

  const handleClientUpdated = () => {
    router.push(`/clients/${clientId}`);
  };

  if (loading) {
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
          <h3 className="text-lg font-semibold">Error loading client</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild className="mt-4">
            <Link href="/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!clientData?.client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Client not found</h3>
          <p className="text-muted-foreground">The client you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${clientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Client</h1>
          <p className="text-muted-foreground">
            Update {clientData.client.name}&apos;s information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Update the client&apos;s details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditClientForm
            clientId={clientId}
            initialData={clientData.client}
            onSuccess={handleClientUpdated}
          />
        </CardContent>
      </Card>
    </div>
  );
}
