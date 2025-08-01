import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { withCache, CacheKeys, CacheTTL, CacheInvalidator } from '@/lib/cache-utils';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await withCache(
      CacheKeys.settings(session.user.email),
      async () => {
        await dbConnect();

        // Find existing settings or create default ones
        let settings = await Settings.findOne({ userId: session.user.email });

        if (!settings) {
          // Create default settings if none exist
          settings = await Settings.create({
            userId: session.user.email,
            companyInfo: {
              name: 'Your Company Name',
              address: '',
              phone: '',
              email: '',
              website: '',
            },
            invoiceSettings: {
              prefix: 'INV',
              defaultDueDate: 30,
              defaultTaxRate: 0,
              termsAndConditions: '',
            },
            notifications: {
              overdueReminders: true,
            },
          });
        }

        return settings;
      },
      CacheTTL.VERY_LONG
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyInfo, invoiceSettings, notifications } = body;

    // Validate required fields
    if (!companyInfo || !invoiceSettings || !notifications) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      { userId: session.user.email },
      {
        companyInfo,
        invoiceSettings,
        notifications,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Invalidate settings cache
    await CacheInvalidator.invalidateSettings(session.user.email);

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
