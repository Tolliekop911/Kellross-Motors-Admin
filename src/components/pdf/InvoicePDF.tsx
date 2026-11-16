import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS } from "@/lib/business";
import type { Invoice } from "@/lib/types";
import { invoiceTotals } from "@/lib/data";

const money = (n: number) =>
  `${BUSINESS.currency} ${(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  muted: { color: "#555", fontSize: 8 },
  box: { borderWidth: 1, borderColor: "#111" },
  cell: { padding: 4, borderColor: "#111" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  label: { fontFamily: "Helvetica-Bold" },
  line: { borderBottomWidth: 0.5, borderColor: "#999", minHeight: 16, paddingVertical: 2 },
});

export function InvoicePDF({ inv }: { inv: Invoice }) {
  const t = invoiceTotals(inv);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.between, { alignItems: "flex-start" }]}>
          <View>
            <Text style={s.brand}>KellRoss Motors CC</Text>
            <Text style={s.muted}>Reg: {BUSINESS.reg}   VAT: {BUSINESS.vat}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.muted}>{BUSINESS.address}</Text>
            <Text style={s.muted}>Tel: {BUSINESS.tel}  |  Cell: {BUSINESS.cell}</Text>
            <Text style={s.muted}>Fax: {BUSINESS.fax}  |  {BUSINESS.email}</Text>
          </View>
        </View>

        <View style={[s.box, { marginTop: 10, flexDirection: "row" }]}>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: "#111" }}>
            {[
              ["Customer", inv.customer],
              ["Postal Address", inv.postalAddress],
              ["Telephone No", inv.telephone],
              ["Fax No", inv.fax],
              ["Vehicle Detail", inv.vehicleDetail],
            ].map(([l, v]) => (
              <View key={l} style={[s.row, s.cell, { borderBottomWidth: 0.5 }]}>
                <Text style={[s.label, { width: 80 }]}>{l}:</Text>
                <Text>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: 200 }}>
            <View style={[s.cell, { borderBottomWidth: 1, alignItems: "center" }]}>
              <Text style={s.th}>TAX INVOICE NO.</Text>
              <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>{inv.invoiceNo}</Text>
            </View>
            {[
              ["Date", inv.date],
              ["Customer Order No", inv.customerOrderNo],
              ["Our Service Call No", inv.serviceCallNo],
              ["Contact", inv.contact],
            ].map(([l, v]) => (
              <View key={l} style={[s.row, s.cell, { borderBottomWidth: 0.5 }]}>
                <Text style={[s.label, { width: 92 }]}>{l}:</Text>
                <Text>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={[s.box, { marginTop: 8 }]}>
          <View style={[s.row, { borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#f0f0f0" }]}>
            <Text style={[s.cell, s.th, { width: 55, borderRightWidth: 1 }]}>Quantity</Text>
            <Text style={[s.cell, s.th, { flex: 1, borderRightWidth: 1 }]}>Item</Text>
            <Text style={[s.cell, s.th, { width: 75, borderRightWidth: 1, textAlign: "right" }]}>Each</Text>
            <Text style={[s.cell, s.th, { width: 80, textAlign: "right" }]}>Total</Text>
          </View>
          {padLines(inv).map((l, i) => (
            <View key={i} style={[s.row, { borderBottomWidth: 0.5, borderColor: "#ccc", minHeight: 16 }]}>
              <Text style={[s.cell, { width: 55, borderRightWidth: 1, borderColor: "#ccc" }]}>{l.quantity}</Text>
              <Text style={[s.cell, { flex: 1, borderRightWidth: 1, borderColor: "#ccc" }]}>{l.item}</Text>
              <Text style={[s.cell, { width: 75, borderRightWidth: 1, borderColor: "#ccc", textAlign: "right" }]}>{l.each ? money(l.each) : ""}</Text>
              <Text style={[s.cell, { width: 80, textAlign: "right" }]}>{l.item ? money((Number(l.quantity) || 0) * (l.each || 0)) : ""}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={[s.between, { marginTop: 8 }]}>
          <View>
            <Text style={s.label}>Banking Details:</Text>
            <Text>{BUSINESS.banking.name}</Text>
            <Text>{BUSINESS.banking.bank}</Text>
            <Text>Branch: {BUSINESS.banking.branch}</Text>
            <Text>Cheque Acc: {BUSINESS.banking.account}</Text>
          </View>
          <View style={{ width: 200 }}>
            <Totals label="SUB TOTAL" value={money(t.subtotal)} />
            <Totals label={`VAT (${BUSINESS.vatRate * 100}%)`} value={money(t.vat)} />
            <Totals label="TOTAL" value={money(t.total)} bold />
          </View>
        </View>

        <View style={[s.between, { marginTop: 28 }]}>
          <Text style={s.muted}>Customer&apos;s Signature ______________________</Text>
          <Text style={s.muted}>Print Name in full ______________________</Text>
        </View>
      </Page>
    </Document>
  );
}

function Totals({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={[s.row, s.box, { borderTopWidth: 0, borderBottomWidth: 1 }]}>
      <Text style={[s.cell, { flex: 1, borderRightWidth: 1, borderColor: "#111", fontFamily: bold ? "Helvetica-Bold" : "Helvetica" }]}>{label}</Text>
      <Text style={[s.cell, { width: 90, textAlign: "right", fontFamily: bold ? "Helvetica-Bold" : "Helvetica" }]}>{value}</Text>
    </View>
  );
}

function padLines(inv: Invoice) {
  const lines = [...inv.lines];
  while (lines.length < 14) lines.push({ quantity: "", item: "", each: 0 });
  return lines;
}
