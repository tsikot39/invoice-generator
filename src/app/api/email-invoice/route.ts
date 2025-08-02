import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/lib/auth-helper';
import dbConnect from '@/lib/mongodb';
import { InvoiceModel, ClientModel } from '@/lib/models';
import { getInvoicePDFBlob } from '@/lib/pdf-generator';
import { Settings } from '@/models/Settings';
import { getDefaultCompanyInfo } from '@/lib/settings-helper';

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    console.log('Email invoice POST route hit!');

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { invoiceId } = await request.json();
    console.log('Invoice ID:', invoiceId);

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    await dbConnect();

    const invoice = await InvoiceModel.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.userId !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = await ClientModel.findById(invoice.clientId);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 400 });
    }

    if (!client.email) {
      return NextResponse.json({ error: 'Client email not found' }, { status: 400 });
    }

    console.log('Sending to client:', client.email);

    // Get company info from settings or use defaults
    let companyInfo = getDefaultCompanyInfo();
    try {
      const userSettings = await Settings.findOne({
        userId: session.user.email,
      });
      if (userSettings?.companyInfo) {
        companyInfo = userSettings.companyInfo;
      }
    } catch (error) {
      console.warn('Failed to fetch user settings, using defaults:', error);
    }

    const pdfData = {
      invoice: {
        ...invoice.toObject(),
        userId: invoice.userId,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        createdAt: new Date(invoice.createdAt),
        updatedAt: new Date(invoice.updatedAt),
      },
      client: {
        ...client.toObject(),
        userId: client.userId || '',
        createdAt: new Date(client.createdAt || Date.now()),
        updatedAt: new Date(client.updatedAt || Date.now()),
        address: typeof client.address === 'string' ? client.address : 'No address provided',
      },
      companyInfo,
    };

    const pdfBlob = await getInvoicePDFBlob(pdfData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourcompany.com',
      to: [client.email],
      subject: `Invoice ${invoice.invoiceNumber} from ${session.user.name || 'Your Business'}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .invoice-details { background-color: #fff; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Invoice from ${session.user.name || 'Your Business'}</h2>
              </div>
              
              <p>Hello ${client.name},</p>
              
              <p>Please find attached your invoice for recent services. Here are the invoice details:</p>
              
              <div class="invoice-details">
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Amount:</strong> $${invoice.total.toFixed(2)}</p>
              </div>
              
              <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
              
              <div class="footer">
                <p>Thank you for your business!</p>
                <p>${session.user.name || 'Your Business'}</p>
                <p>${session.user.email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', data?.id);

    // Update invoice status to sent and add sent timestamp
    await InvoiceModel.findByIdAndUpdate(invoiceId, {
      status: 'sent',
      sentAt: new Date(),
    });

    console.log('Invoice status updated to sent');

    return NextResponse.json({
      success: true,
      message: `Invoice sent successfully to ${client.email}`,
      emailId: data?.id,
    });
  } catch (error) {
    console.error('Email invoice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
