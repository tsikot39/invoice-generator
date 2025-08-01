import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-helper";
import dbConnect from "@/lib/mongodb";
import { InvoiceModel, ClientModel } from "@/lib/models";
import { updateInvoiceSchema } from "@/schemas";
import { createApiError, createApiResponse } from "@/lib/utils-invoice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError("Unauthorized", 401), {
        status: 401,
      });
    }

    await dbConnect();

    const { id } = await params;

    const invoice = await InvoiceModel.findOne({
      _id: id,
      userId: session.user.email,
    }).lean();

    if (!invoice) {
      return NextResponse.json(createApiError("Invoice not found", 404), {
        status: 404,
      });
    }

    // Fetch client information
    let client = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceData = invoice as any;

    if (invoiceData.clientId) {
      const clientData = await ClientModel.findOne({
        _id: invoiceData.clientId,
        userId: session.user.email,
      }).lean();

      if (clientData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { _id: clientId, ...clientRest } = clientData as any;
        client = {
          ...clientRest,
          id: clientId?.toString(),
        };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { _id, ...rest } = invoice as any;

    return NextResponse.json(
      createApiResponse({
        invoice: {
          ...rest,
          id: _id.toString(),
          client,
        },
      })
    );
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json(createApiError("Internal server error", 500), {
      status: 500,
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError("Unauthorized", 401), {
        status: 401,
      });
    }

    const body = await request.json();

    // Convert date strings to Date objects for validation
    if (body.issueDate && typeof body.issueDate === "string") {
      body.issueDate = new Date(body.issueDate);
    }
    if (body.dueDate && typeof body.dueDate === "string") {
      body.dueDate = new Date(body.dueDate);
    }

    const validation = updateInvoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createApiError(
          "Validation failed",
          400,
          validation.error.flatten().fieldErrors
        ),
        { status: 400 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const invoice = await InvoiceModel.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return NextResponse.json(createApiError("Invoice not found", 404), {
        status: 404,
      });
    }

    return NextResponse.json(
      createApiResponse(
        {
          invoice: {
            ...invoice.toObject(),
            id: invoice._id.toString(),
          },
        },
        "Invoice updated successfully"
      )
    );
  } catch (error) {
    console.error("PUT /api/invoices/[id] error:", error);
    return NextResponse.json(createApiError("Internal server error", 500), {
      status: 500,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError("Unauthorized", 401), {
        status: 401,
      });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["draft", "sent", "paid", "overdue"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        createApiError(
          "Invalid status. Must be one of: draft, sent, paid, overdue",
          400
        ),
        { status: 400 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const invoice = await InvoiceModel.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return NextResponse.json(createApiError("Invoice not found", 404), {
        status: 404,
      });
    }

    return NextResponse.json(
      createApiResponse(
        {
          invoice: {
            ...invoice.toObject(),
            id: invoice._id.toString(),
          },
        },
        "Invoice status updated successfully"
      )
    );
  } catch (error) {
    console.error("PATCH /api/invoices/[id] error:", error);
    return NextResponse.json(createApiError("Internal server error", 500), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError("Unauthorized", 401), {
        status: 401,
      });
    }

    await dbConnect();

    const { id } = await params;

    const invoice = await InvoiceModel.findOneAndDelete({
      _id: id,
      userId: session.user.email,
    });

    if (!invoice) {
      return NextResponse.json(createApiError("Invoice not found", 404), {
        status: 404,
      });
    }

    return NextResponse.json(
      createApiResponse(null, "Invoice deleted successfully")
    );
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json(createApiError("Internal server error", 500), {
      status: 500,
    });
  }
}
