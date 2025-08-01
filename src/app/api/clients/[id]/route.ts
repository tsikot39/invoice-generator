import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { ClientModel } from '@/lib/models';
import { updateClientSchema } from '@/schemas';
import { createApiError, createApiResponse } from '@/lib/utils-invoice';
import { withCache, CacheKeys, CacheTTL, CacheInvalidator } from '@/lib/cache-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const { id } = await params;

    // Use cache for individual client data
    const result = await withCache(
      CacheKeys.client(session.user.email, id),
      async () => {
        await dbConnect();

        const client = await ClientModel.findOne({
          _id: id,
          userId: session.user.email,
        }).lean();

        if (!client) {
          throw new Error('Client not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { _id, ...rest } = client as any;

        return {
          client: {
            ...rest,
            id: _id.toString(),
          },
        };
      },
      CacheTTL.LONG
    );

    return NextResponse.json(createApiResponse(result));
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const body = await request.json();
    const validation = updateClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createApiError('Validation failed', 400, validation.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    const { id } = await params;
    await dbConnect();

    const client = await ClientModel.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!client) {
      return NextResponse.json(createApiError('Client not found', 404), {
        status: 404,
      });
    }

    // Invalidate client caches after update
    await CacheInvalidator.invalidateClients(session.user.email, id);

    return NextResponse.json(
      createApiResponse(
        {
          client: {
            ...client.toObject(),
            id: client._id.toString(),
          },
        },
        'Client updated successfully'
      )
    );
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const { id } = await params;
    await dbConnect();

    // Check if client exists and belongs to the user
    const client = await ClientModel.findOne({
      _id: id,
      userId: session.user.email,
    });

    if (!client) {
      return NextResponse.json(createApiError('Client not found', 404), {
        status: 404,
      });
    }

    // Check for existing invoices - import InvoiceModel at the top if not already imported
    const { InvoiceModel } = await import('@/lib/models');
    const existingInvoices = await InvoiceModel.find({
      client: id,
      userId: session.user.email,
    }).limit(1);

    if (existingInvoices.length > 0) {
      return NextResponse.json(
        createApiError(
          'Cannot delete client with existing invoices. Please delete all invoices for this client first.',
          400
        ),
        { status: 400 }
      );
    }

    // If no invoices, proceed with deletion
    await ClientModel.findOneAndDelete({
      _id: id,
      userId: session.user.email,
    });

    // Invalidate client caches after deletion
    await CacheInvalidator.invalidateClients(session.user.email, id);

    return NextResponse.json(createApiResponse(null, 'Client deleted successfully'));
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
