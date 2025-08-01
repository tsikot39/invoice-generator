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

    // Find all invoices that should be processed for reminders
    const overdueInvoices = await InvoiceModel.find({
      userId: session.user.email,
      status: "overdue",
    }).populate("clientId");

    const now = new Date();
    const candidatesForReminder = [];

    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we should send a reminder based on rules:
      // - First reminder: 1 day after due date
      // - Subsequent reminders: every 7 days
      let shouldSendReminder = false;

      if (!invoice.lastReminderSent) {
        // No reminder sent yet, send if 1+ days overdue
        shouldSendReminder = daysOverdue >= 1;
      } else {
        // Check if 7+ days since last reminder
        const daysSinceLastReminder = Math.floor(
          (now.getTime() - invoice.lastReminderSent.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        shouldSendReminder = daysSinceLastReminder >= 7;
      }

      if (shouldSendReminder) {
        candidatesForReminder.push({
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          daysOverdue,
          clientEmail: invoice.clientId?.email,
          lastReminderSent: invoice.lastReminderSent,
          remindersSentCount: invoice.remindersSent?.length || 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalOverdueInvoices: overdueInvoices.length,
      candidatesForReminder: candidatesForReminder.length,
      candidates: candidatesForReminder,
      message: `Found ${candidatesForReminder.length} invoices that need reminder emails`,
    });
  } catch (error) {
    console.error("Auto reminder check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Get the candidates from the GET endpoint logic
    const checkResponse = await GET();
    const checkData = await checkResponse.json();

    if (!checkData.success || checkData.candidatesForReminder === 0) {
      return NextResponse.json({
        success: true,
        message: "No invoices need reminders at this time",
        processed: 0,
      });
    }

    // Send reminders to all candidates
    const reminderResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/overdue-reminders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: In a real cron job, you'd need proper authentication
        },
      }
    );

    const reminderData = await reminderResponse.json();

    return NextResponse.json({
      success: true,
      message: "Auto-reminder process completed",
      checkResults: checkData,
      reminderResults: reminderData,
    });
  } catch (error) {
    console.error("Auto reminder process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
