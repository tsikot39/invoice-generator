import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { InvoiceModel } from '@/lib/models';
import { createApiError, createApiResponse } from '@/lib/utils-invoice';
import { withCache, CacheKeys, CacheTTL } from '@/lib/cache-utils';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const userId = session.user.email;

    // Use cache for dashboard data with 5-minute TTL
    const stats = await withCache(
      CacheKeys.dashboard(userId),
      async () => {
        await dbConnect();

        // Auto-update overdue invoices before calculating stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await InvoiceModel.updateMany(
          {
            userId,
            status: 'sent',
            dueDate: { $lt: today },
          },
          {
            status: 'overdue',
            updatedAt: new Date(),
          }
        );

        // Get total invoices count
        const totalInvoices = await InvoiceModel.countDocuments({ userId });

        // Get total paid amount
        const paidInvoices = await InvoiceModel.aggregate([
          { $match: { userId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);

        // Get total outstanding amount (sent + overdue)
        const outstandingInvoices = await InvoiceModel.aggregate([
          { $match: { userId, status: { $in: ['sent', 'overdue'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);

        // Get total overdue amount
        const overdueInvoices = await InvoiceModel.aggregate([
          { $match: { userId, status: 'overdue' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);

        // Get recent invoices (last 10)
        const recentInvoices = await InvoiceModel.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Get invoices by status with improved aggregation and duplicate prevention
        const invoicesByStatus = await InvoiceModel.aggregate([
          {
            $match: {
              userId,
              $and: [
                { status: { $exists: true } },
                { status: { $ne: null } },
                { status: { $ne: '' } },
              ],
            },
          },
          // Add a stage to normalize status values before grouping
          {
            $addFields: {
              normalizedStatus: {
                $trim: {
                  input: { $toLower: '$status' },
                },
              },
            },
          },
          { $group: { _id: '$normalizedStatus', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]);

        // Create a clean status object with guaranteed uniqueness
        const processedStatuses: Record<string, number> = {};

        console.log('Raw invoicesByStatus from aggregation:', invoicesByStatus);

        invoicesByStatus.forEach(item => {
          if (item._id && typeof item._id === 'string' && item.count > 0) {
            const normalizedStatus = item._id.trim();
            // Capitalize first letter for consistent display
            const displayStatus =
              normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

            console.log(
              `Processing: normalizedStatus="${normalizedStatus}", displayStatus="${displayStatus}", count=${item.count}`
            );

            // Since we normalized in the aggregation, there should be no duplicates
            // But add this as extra safety
            if (processedStatuses[displayStatus]) {
              console.log(
                `Found duplicate for "${displayStatus}": existing=${processedStatuses[displayStatus]}, adding=${item.count}`
              );
              processedStatuses[displayStatus] += item.count;
            } else {
              processedStatuses[displayStatus] = item.count;
            }
          }
        });

        console.log('Final processedStatuses:', processedStatuses);

        // Monthly revenue for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await InvoiceModel.aggregate([
          {
            $match: {
              userId,
              status: 'paid',
              paidAt: { $gte: sixMonthsAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$paidAt' },
                month: { $month: '$paidAt' },
              },
              revenue: { $sum: '$total' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        return {
          totalInvoices,
          totalPaid: paidInvoices[0]?.total || 0,
          totalOutstanding: outstandingInvoices[0]?.total || 0,
          totalOverdue: overdueInvoices[0]?.total || 0,
          recentInvoices: recentInvoices.map(invoice => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { _id, ...rest } = invoice as any;
            return {
              ...rest,
              id: _id.toString(),
            };
          }),
          invoicesByStatus: processedStatuses,
          monthlyRevenue: monthlyRevenue.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            revenue: item.revenue,
            count: item.count,
          })),
        };
      },
      CacheTTL.MEDIUM
    );

    return NextResponse.json(createApiResponse(stats));
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
