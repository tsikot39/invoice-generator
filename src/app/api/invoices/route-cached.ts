import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { InvoiceModel, ClientModel } from '@/lib/models';
import { createInvoiceSchema } from '@/schemas';
import { createApiError, createApiResponse, generateInvoiceNumber } from '@/lib/utils-invoice';
import { withCache, CacheKeys, CacheTTL, CacheInvalidator } from '@/lib/cache-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const clientId = searchParams.get('clientId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use cache for invoices data
    const result = await withCache(
      CacheKeys.invoices(session.user.email, page, limit, search, status, clientId),
      async () => {
        await dbConnect();

        // Auto-update overdue invoices before filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await InvoiceModel.updateMany(
          {
            userId: session.user.email,
            status: 'sent',
            dueDate: { $lt: today },
          },
          {
            status: 'overdue',
            updatedAt: new Date(),
          }
        );

        const skip = (page - 1) * limit;
        const baseQuery = { userId: session.user.email };
        const query = {
          ...baseQuery,
          ...(search && {
            $or: [
              { invoiceNumber: { $regex: search, $options: 'i' } },
              { notes: { $regex: search, $options: 'i' } },
            ],
          }),
          ...(status && { status }),
          ...(clientId && { clientId }),
        };

        const [invoices, total] = await Promise.all([
          InvoiceModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
          InvoiceModel.countDocuments(query),
        ]);

        // Get all unique client IDs from invoices
        const clientIds = [...new Set(invoices.map(invoice => invoice.clientId))];

        // Fetch client data for all client IDs
        const clients = await ClientModel.find({
          _id: { $in: clientIds },
          userId: session.user.email,
        }).lean();

        // Create a map for quick client lookup
        const clientMap = new Map();
        clients.forEach(client => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clientMap.set((client as any)._id.toString(), client);
        });

        return {
          invoices: invoices.map(invoice => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { _id, ...rest } = invoice as any;
            const client = clientMap.get(invoice.clientId);
            return {
              ...rest,
              id: _id.toString(),
              clientName: client?.name || 'Unknown Client',
              client: client
                ? {
                    id: client._id.toString(),
                    name: client.name,
                    email: client.email,
                  }
                : null,
            };
          }),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      },
      CacheTTL.SHORT // Shorter TTL for invoices due to frequent updates
    );

    return NextResponse.json(createApiResponse(result));
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST request received - This should show in terminal!');

  try {
    console.log('=== POST /api/invoices - Starting request ===');
    const session = await auth();
    console.log('Session user email:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const validation = createInvoiceSchema.safeParse(body);
    console.log('Validation successful:', validation.success);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.flatten());
      return NextResponse.json(
        createApiError('Validation failed', 400, validation.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    console.log('✅ Data validated successfully');
    await dbConnect();
    console.log('✅ Database connected');

    // Verify client exists and belongs to user
    const client = await ClientModel.findOne({
      _id: validation.data.clientId,
      userId: session.user.email,
    });

    if (!client) {
      console.log("❌ Client not found or doesn't belong to user");
      return NextResponse.json(createApiError('Client not found', 404), {
        status: 404,
      });
    }

    console.log('✅ Client verified:', client.name);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(session.user.email);
    console.log('✅ Generated invoice number:', invoiceNumber);

    // Create invoice data
    const invoiceData = {
      ...validation.data,
      userId: session.user.email,
      invoiceNumber,
      clientName: client.name,
    };

    console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2));

    const invoice = await InvoiceModel.create(invoiceData);
    console.log('✅ Invoice created successfully with ID:', invoice._id);

    // Invalidate invoices cache after creating a new invoice
    await CacheInvalidator.invalidateInvoices(session.user.email);

    const responseData = {
      invoice: {
        ...invoice.toObject(),
        id: invoice._id.toString(),
      },
    };

    console.log('=== POST /api/invoices - Request completed successfully ===');

    return NextResponse.json(createApiResponse(responseData, 'Invoice created successfully', 201), {
      status: 201,
    });
  } catch (error) {
    console.error('❌ POST /api/invoices error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
