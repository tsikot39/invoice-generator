import mongoose from 'mongoose';

interface ISettings {
  userId: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  invoiceSettings: {
    prefix: string;
    defaultDueDate: number;
    defaultTaxRate: number;
    termsAndConditions: string;
  };
  notifications: {
    overdueReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyInfo: {
      name: {
        type: String,
        default: 'Your Company Name',
      },
      address: {
        type: String,
        default: '',
      },
      phone: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
      website: {
        type: String,
        default: '',
      },
    },
    invoiceSettings: {
      prefix: {
        type: String,
        default: 'INV',
      },
      defaultDueDate: {
        type: Number,
        default: 30,
      },
      defaultTaxRate: {
        type: Number,
        default: 0,
      },
      termsAndConditions: {
        type: String,
        default: '',
      },
    },
    notifications: {
      overdueReminders: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Settings =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
export type { ISettings };
