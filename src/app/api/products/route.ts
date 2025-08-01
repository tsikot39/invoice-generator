import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { ProductModel } from '@/lib/models';
import { createProductSchema } from '@/schemas';
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
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use cache for products data
    const result = await withCache(
      CacheKeys.products(session.user.email, page, limit, search, category),
      async () => {
        await dbConnect();

        const skip = (page - 1) * limit;
        const baseQuery = { userId: session.user.email };
        const query = {
          ...baseQuery,
          ...(search && {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ],
          }),
          ...(category && { category }),
        };

        const [products, total] = await Promise.all([
          ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
          ProductModel.countDocuments(query),
        ]);

        return {
          products: products.map(product => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { _id, ...rest } = product as any;
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
    console.error('GET /api/products error:', error);
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
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createApiError('Validation failed', 400, validation.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await ProductModel.create({
      ...validation.data,
      userId: session.user.email,
    });

    // Invalidate products cache after creating a new product
    await CacheInvalidator.invalidateProducts(session.user.email);

    return NextResponse.json(
      createApiResponse(
        {
          product: {
            ...product.toObject(),
            id: product._id.toString(),
          },
        },
        'Product created successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
