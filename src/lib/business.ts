// KellRoss Motors CC — business details taken from the official job card & invoice.
export const BUSINESS = {
  name: "KellRoss Motors CC",
  reg: "2011/059124/23",
  vat: "4620260234",
  address: "42b Clarendon Rd, Gants Centre, Strand",
  tel: "021 853 1751",
  cell: "082 471 4691",
  fax: "086 2605137",
  email: "mrossouw6@gmail.com",
  banking: {
    name: "Kellross Motors CC",
    bank: "FNB Somerset West",
    branch: "200512",
    account: "62 311 5251 51",
  },
  vatRate: 0.15, // 15% South African VAT
  currency: "R",
  // New documents continue the sequence from the current paper books.
  startingJobCardNo: 24145,
  startingInvoiceNo: 23230,
  // Default max vehicles booked in per day (staff can change this in the admin).
  defaultMaxBookingsPerDay: 8,
  terms: [
    "All vehicles and their contents are stored and driven at vehicle owner's own risk. Assuring you all precaution and care taken we are not responsible for any damage due to fire, theft or any other cause. Please remove all valuables from your vehicle.",
    "All quotes are subject to stripping - a 50% deposit is required on quotes over R5000 before any work will be carried out. A storage fee of R120/day will be levied on vehicles not collected 48hrs after completion of work.",
    "PAYMENT IS DUE BEFORE ANY VEHICLE CAN BE RELEASED - WE DO NOT OFFER CREDIT. WE ACCEPT VISA/MAESTRO/MASTER DEBIT AND CREDIT CARDS, CASH AND EFT - NOT GARAGE CARD AND NO CHEQUES.",
    "We guarantee genuine parts for one year, we guarantee our workmanship for one year. We do not offer any guarantee on non-genuine parts. Guarantee becomes void if anyone other than FCC Staff work on vehicle. Prices are subject to change with prior notice.",
  ],
  damageCodes: [
    { code: "S", label: "Scratch" },
    { code: "P", label: "Paint" },
    { code: "D", label: "Dent" },
    { code: "A", label: "Accident" },
    { code: "W", label: "Windscreen" },
    { code: "L", label: "Lights" },
  ],
} as const;

export const money = (n: number) =>
  `${BUSINESS.currency} ${(Number.isFinite(n) ? n : 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
