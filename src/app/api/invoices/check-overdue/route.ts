import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-helper";
import dbConnect from "@/lib/mongodb";
import { InvoiceModel } from "@/lib/models";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find all invoices that are "sent" but past their due date
    const overdueInvoices = await InvoiceModel.find({
      userId: session.user.email,
      status: "sent",
      dueDate: { $lt: today },
    }).select("invoiceNumber dueDate status");

    return NextResponse.json({
      success: true,
      data: {
        message: `Found ${overdueInvoices.length} invoices that should be overdue`,
        count: overdueInvoices.length,
        invoices: overdueInvoices.map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          status: inv.status,
          daysOverdue: Math.floor(
            (today.getTime() - new Date(inv.dueDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
      },
      message: `Found ${overdueInvoices.length} invoices that should be overdue`,
    });
  } catch (error) {
    console.error("Failed to check overdue invoices:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find all invoices that are "sent" but past their due date
    const overdueInvoices = await InvoiceModel.find({
      userId: session.user.email,
      status: "sent",
      dueDate: { $lt: today },
    });

    // Update them to overdue status
    const updatePromises = overdueInvoices.map((invoice) =>
      InvoiceModel.findByIdAndUpdate(
        invoice._id,
        {
          status: "overdue",
          updatedAt: new Date(),
        },
        { new: true }
      )
    );

    const updatedInvoices = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: {
        message: `Updated ${updatedInvoices.length} invoices to overdue status`,
        updatedCount: updatedInvoices.length,
        invoiceIds: updatedInvoices.map((inv) => inv?.id).filter(Boolean),
      },
      message: `Updated ${updatedInvoices.length} invoices to overdue status`,
    });
  } catch (error) {
    console.error("Failed to check overdue invoices:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
