"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check, Clock, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface StatusUpdateDropdownProps {
  currentStatus: string;
  invoiceId: string;
  invoiceNumber: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusConfig = {
  draft: {
    label: "Draft",
    icon: Clock,
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    variant: "secondary" as const,
  },
  sent: {
    label: "Sent",
    icon: Send,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    variant: "default" as const,
  },
  paid: {
    label: "Paid",
    icon: Check,
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    variant: "default" as const,
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    variant: "destructive" as const,
  },
};

export function StatusUpdateDropdown({
  currentStatus,
  invoiceId,
  invoiceNumber,
  onStatusUpdate,
}: StatusUpdateDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const updateStatus = async (newStatus: string) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
        onStatusUpdate?.(newStatus);
        toast.success(
          `Invoice ${invoiceNumber} status updated to ${
            statusConfig[newStatus as keyof typeof statusConfig].label
          }`
        );
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update invoice status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update invoice status");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentConfig = statusConfig[status as keyof typeof statusConfig];
  const CurrentIcon = currentConfig?.icon || Clock;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          disabled={isUpdating}
        >
          <Badge
            variant={currentConfig?.variant || "secondary"}
            className={`${currentConfig?.color} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <CurrentIcon className="h-3 w-3" />
            {currentConfig?.label || status}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {Object.entries(statusConfig).map(([statusKey, config]) => {
          const Icon = config.icon;
          const isCurrentStatus = statusKey === status;

          return (
            <DropdownMenuItem
              key={statusKey}
              onClick={() => updateStatus(statusKey)}
              className={`flex items-center gap-2 cursor-pointer ${
                isCurrentStatus ? "bg-muted" : ""
              }`}
              disabled={isUpdating || isCurrentStatus}
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
              {isCurrentStatus && <Check className="h-3 w-3 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
