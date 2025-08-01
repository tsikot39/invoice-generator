import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { ProductModel } from '@/lib/models';
import { updateProductSchema } from '@/schemas';
import { createApiError, createApiResponse } from '@/lib/utils-invoice';
import { withCache, CacheKeys, CacheTTL, CacheInvalidator } from '@/lib/cache-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    // Use cache for individual product data
    const result = await withCache(
      CacheKeys.product(session.user.email, id),
      async () => {
        await dbConnect();

        const product = await ProductModel.findOne({
          _id: id,
          userId: session.user.email,
        }).lean();

        if (!product) {
          throw new Error('Product not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { _id, ...rest } = product as any;

        return {
          product: {
            ...rest,
            id: _id.toString(),
          },
        };
      },
      CacheTTL.LONG
    );

    return NextResponse.json(createApiResponse(result));
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createApiError('Validation failed', 400, validation.error.flatten().fieldErrors),
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await ProductModel.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(createApiError('Product not found', 404), {
        status: 404,
      });
    }

    // Invalidate product caches after update
    await CacheInvalidator.invalidateProducts(session.user.email, id);

    return NextResponse.json(
      createApiResponse(
        {
          product: {
            ...product.toObject(),
            id: product._id.toString(),
          },
        },
        'Product updated successfully'
      )
    );
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error);
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
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    await dbConnect();

    const product = await ProductModel.findOneAndDelete({
      _id: id,
      userId: session.user.email,
    });

    if (!product) {
      return NextResponse.json(createApiError('Product not found', 404), {
        status: 404,
      });
    }

    // Invalidate product caches after deletion
    await CacheInvalidator.invalidateProducts(session.user.email, id);

    return NextResponse.json(createApiResponse(null, 'Product deleted successfully'));
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
