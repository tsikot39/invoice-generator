import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { InvoiceModel, ClientModel } from '@/lib/models';
import { Settings } from '@/models/Settings';
import { getDefaultCompanyInfo } from '@/lib/settings-helper';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, manualTrigger = false } = body;

    await dbConnect();

    // If specific invoice ID provided, send reminder for that invoice
    if (invoiceId) {
      const result = await sendReminderForInvoice(session.user.email, invoiceId, manualTrigger);
      return NextResponse.json(result);
    }

    // Otherwise, check all overdue invoices and send reminders
    const result = await sendOverdueReminders(session.user.email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Overdue reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReminderForInvoice(
  userId: string,
  invoiceId: string,
  manualTrigger: boolean = false
) {
  const invoice = await InvoiceModel.findById(invoiceId);

  if (!invoice || invoice.userId !== userId) {
    return { error: 'Invoice not found', status: 404 };
  }

  if (invoice.status !== 'overdue') {
    return { error: 'Invoice is not overdue', status: 400 };
  }

  const client = await ClientModel.findById(invoice.clientId);
  if (!client || !client.email) {
    return { error: 'Client email not found', status: 400 };
  }

  // Check user's notification preferences
  const userSettings = await Settings.findOne({ userId });
  if (!manualTrigger && userSettings && !userSettings.notifications.overdueReminders) {
    return {
      message: 'Overdue reminders are disabled in settings',
      skipped: true,
    };
  }

  // Calculate days overdue
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // Check if we've sent a reminder recently (within last 7 days)
  if (!manualTrigger && invoice.lastReminderSent) {
    const daysSinceLastReminder = Math.floor(
      (today.getTime() - invoice.lastReminderSent.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastReminder < 7) {
      return {
        message: 'Reminder already sent recently',
        skipped: true,
        daysSinceLastReminder,
      };
    }
  }

  // Get company info
  let companyInfo = getDefaultCompanyInfo();
  if (userSettings?.companyInfo) {
    companyInfo = userSettings.companyInfo;
  }

  // Send reminder email
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@yourcompany.com',
    to: [client.email],
    subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`,
    html: generateReminderEmailHtml({
      invoice,
      client,
      companyInfo,
      daysOverdue,
    }),
  });

  if (error) {
    console.error('Failed to send reminder email:', error);
    return { error: 'Failed to send reminder email', details: error.message };
  }

  // Update invoice with reminder info
  await InvoiceModel.findByIdAndUpdate(invoiceId, {
    $push: {
      remindersSent: {
        type: 'overdue',
        sentAt: new Date(),
        daysOverdue,
      },
    },
    lastReminderSent: new Date(),
  });

  return {
    success: true,
    message: `Reminder sent to ${client.email}`,
    emailId: data?.id,
    daysOverdue,
  };
}

async function sendOverdueReminders(userId: string) {
  // Find all overdue invoices for this user
  const overdueInvoices = await InvoiceModel.find({
    userId,
    status: 'overdue',
  });

  const results = [];
  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const invoice of overdueInvoices) {
    try {
      const result = await sendReminderForInvoice(userId, invoice._id.toString(), false);
      results.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        ...result,
      });

      if (result.success) {
        sentCount++;
      } else if (result.skipped) {
        skippedCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
      results.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        error: 'Failed to process reminder',
      });
      errorCount++;
    }
  }

  return {
    success: true,
    message: `Processed ${overdueInvoices.length} overdue invoices`,
    summary: {
      total: overdueInvoices.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
    },
    results,
  };
}

function generateReminderEmailHtml({
  invoice,
  client,
  companyInfo,
  daysOverdue,
}: {
  invoice: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    total: number;
  };
  client: {
    name: string;
  };
  companyInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  daysOverdue: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
      <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .invoice-details { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .overdue-notice { background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
          ${companyInfo.phone ? `<p>Phone: ${companyInfo.phone}</p>` : ''}
          ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
        </div>

        <div class="content">
          <h2>Payment Reminder</h2>
          
          <p>Dear ${client.name},</p>
          
          <div class="overdue-notice">
            <strong>⚠️ Overdue Notice:</strong> This invoice is now <strong>${daysOverdue} days overdue</strong>.
          </div>
          
          <p>We hope this message finds you well. This is a friendly reminder that the following invoice is past due:</p>
          
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> $${invoice.total.toFixed(2)}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
          </div>
          
          <p>To avoid any late fees or service interruptions, please submit your payment as soon as possible.</p>
          
          <p>If you have already sent payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>
          
          <p>Thank you for your prompt attention to this matter.</p>
        </div>

        <div class="footer">
          <p><strong>Best regards,</strong></p>
          <p>${companyInfo.name}</p>
          ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
          ${companyInfo.phone ? `<p>Phone: ${companyInfo.phone}</p>` : ''}
          ${companyInfo.website ? `<p>Website: ${companyInfo.website}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
