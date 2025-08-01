export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface InvoiceSettings {
  prefix: string;
  defaultDueDate: number;
  defaultTaxRate: number;
  termsAndConditions: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  overdueReminders: boolean;
  paymentConfirmations: boolean;
}

export interface UserSettings {
  companyInfo: CompanySettings;
  invoiceSettings: InvoiceSettings;
  notifications: NotificationSettings;
}

// Get default company info for PDF generation
export const getDefaultCompanyInfo = (): CompanySettings => ({
  name: "Your Company Name",
  address: "123 Business St, City, State 12345",
  phone: "(555) 123-4567",
  email: "contact@yourcompany.com",
  website: "www.yourcompany.com",
});

// Fetch user settings from API
export const fetchUserSettings = async (): Promise<UserSettings | null> => {
  try {
    const response = await fetch("/api/settings");
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
};

// Get company info with fallback to defaults
export const getCompanyInfo = async (): Promise<CompanySettings> => {
  const settings = await fetchUserSettings();
  if (settings?.companyInfo) {
    return settings.companyInfo;
  }
  return getDefaultCompanyInfo();
};
