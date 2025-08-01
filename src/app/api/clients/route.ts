import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { ClientModel } from '@/lib/models';
import { createClientSchema } from '@/schemas';
import { createApiError, createApiResponse } from '@/lib/utils-invoice';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use cache for clients data
    const result = await withCache(
      CacheKeys.clients(session.user.email, page, limit, search),
      async () => {
        await dbConnect();

        const skip = (page - 1) * limit;
        const baseQuery = { userId: session.user.email };
        const query = search
          ? {
              ...baseQuery,
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
              ],
            }
          : baseQuery;

        const [clients, total] = await Promise.all([
          ClientModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
          ClientModel.countDocuments(query),
        ]);

        return {
          clients: clients.map(client => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { _id, ...rest } = client as any;
            return {
              ...rest,
              id: _id.toString(),
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
      CacheTTL.MEDIUM
    );

    return NextResponse.json(createApiResponse(result));
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const body = await request.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createApiError('Validation failed', 400, validation.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    await dbConnect();

    const client = await ClientModel.create({
      ...validation.data,
      userId: session.user.email,
    });

    // Invalidate clients cache after creating a new client
    await CacheInvalidator.invalidateClients(session.user.email);

    return NextResponse.json(
      createApiResponse(
        {
          client: {
            ...client.toObject(),
            id: client._id.toString(),
          },
        },
        'Client created successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
