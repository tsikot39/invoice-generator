import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-helper";
import dbConnect from "@/lib/mongodb";
import { InvoiceModel, ClientModel } from "@/lib/models";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Create a test client first
    let testClient = await ClientModel.findOne({
      userId: session.user.email,
      name: "Test Overdue Client",
    });

    if (!testClient) {
      testClient = await ClientModel.create({
        userId: session.user.email,
        name: "Test Overdue Client",
        email: "test@overdue.com",
        address: "123 Test Street, Test City, TC 12345",
        phone: "+1 (555) 123-4567",
      });
    }

    // Create a test invoice that's already overdue
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

    const dueDatePast = new Date();
    dueDatePast.setDate(dueDatePast.getDate() - 5); // Due 5 days ago

    // Generate a test invoice number
    const invoiceCount = await InvoiceModel.countDocuments({
      userId: session.user.email,
    });
    const invoiceNumber = `TEST-${String(invoiceCount + 1).padStart(4, "0")}`;

    const testInvoice = await InvoiceModel.create({
      userId: session.user.email,
      invoiceNumber: invoiceNumber,
      clientId: testClient._id,
      clientName: testClient.name,
      issueDate: pastDate,
      dueDate: dueDatePast,
      status: "sent", // This should become overdue
      items: [
        {
          description: "Test Overdue Service",
          quantity: 1,
          price: 100.0,
          total: 100.0,
        },
      ],
      subtotal: 100.0,
      tax: 0,
      total: 100.0,
      notes: "This is a test invoice created to test overdue functionality",
    });

    return NextResponse.json({
      message: "Test overdue invoice created successfully",
      invoice: {
        id: testInvoice._id,
        invoiceNumber: testInvoice.invoiceNumber,
        dueDate: testInvoice.dueDate,
        status: testInvoice.status,
        daysOverdue: Math.floor(
          (new Date().getTime() - dueDatePast.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    console.error("Failed to create test invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
