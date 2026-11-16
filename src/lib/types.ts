export type BookingStatus = "new" | "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  id: string;
  createdAt: number;
  status: BookingStatus;
  // Customer
  name: string;
  email: string;
  tel: string;
  cell: string;
  address: string;
  // Vehicle
  make: string;
  model: string;
  registration: string;
  km: string;
  // Request
  service: string;
  preferredDate: string; // ISO date (yyyy-mm-dd)
  notes: string;
  // Link to the job card created from this booking (if any)
  jobCardId?: string;
}

export interface PartLine {
  partNo: string;
  description: string;
  price: number;
}

export interface JobCard {
  id: string;
  jobCardNo: number;
  createdAt: number;
  updatedAt: number;
  bookingId?: string;
  invoiceId?: string;

  // Customer
  name: string;
  address: string;
  tel: string;
  cell: string;
  email: string;
  methodOfPayment: "cash" | "eft" | "card" | "";

  // Vehicle
  date: string;
  model: string;
  registration: string;
  km: string;
  vin: string;
  fabNo: string;
  radioCode: string;
  keyCode: string;

  // Work
  workToBeDone: string;
  arrivalTime: string;
  departureTime: string;
  remarks: string;
  damageCodes: string[]; // selected codes e.g. ["S","D"]
  oldParts: "yes" | "no" | "";

  // Page 2
  parts: PartLine[];
  labour: string;
  defectsReport: string;
  hours: string;
  techSign: string;
  testDrive: string;
  washed: boolean;
  vacuumed: boolean;
  bookStamped: "yes" | "no" | "";
}

export interface InvoiceLine {
  quantity: string;
  item: string;
  each: number;
}

export interface Invoice {
  id: string;
  invoiceNo: number;
  createdAt: number;
  updatedAt: number;
  jobCardId?: string;

  customer: string;
  postalAddress: string;
  telephone: string;
  fax: string;
  vehicleDetail: string;
  date: string;
  customerOrderNo: string;
  serviceCallNo: string;
  contact: string;

  lines: InvoiceLine[];
  vatIncluded: boolean; // whether the 15% VAT line is applied
}
