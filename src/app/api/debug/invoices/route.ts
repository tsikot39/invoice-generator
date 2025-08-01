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

    // Get all invoices for debugging
    const allInvoices = await InvoiceModel.find({
      userId: session.user.email,
    })
      .select("invoiceNumber dueDate status createdAt")
      .sort({ createdAt: -1 });

    // Find invoices that should be overdue
    const sentInvoices = allInvoices.filter((inv) => inv.status === "sent");
    const overdueInvoices = sentInvoices.filter(
      (inv) => new Date(inv.dueDate) < today
    );

    return NextResponse.json({
      debug: {
        today: today.toISOString(),
        totalInvoices: allInvoices.length,
        sentInvoices: sentInvoices.length,
        shouldBeOverdue: overdueInvoices.length,
      },
      allInvoices: allInvoices.map((inv) => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        status: inv.status,
        isPastDue: new Date(inv.dueDate) < today,
        daysFromDue: Math.floor(
          (today.getTime() - new Date(inv.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
