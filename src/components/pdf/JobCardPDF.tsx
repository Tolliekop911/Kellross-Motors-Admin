import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS, money } from "@/lib/business";
import type { JobCard } from "@/lib/types";

const s = StyleSheet.create({
  page: { padding: 24, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  row: { flexDirection: "row" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  muted: { color: "#555", fontSize: 8 },
  box: { borderWidth: 1, borderColor: "#111", marginTop: 8 },
  cell: { padding: 4 },
  label: { fontFamily: "Helvetica-Bold" },
  field: { borderBottomWidth: 0.5, borderColor: "#999", minHeight: 14, paddingBottom: 1 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 2 },
  terms: { fontSize: 6.5, color: "#444", marginTop: 4, fontStyle: "italic" },
});

function Field({ label, value, w }: { label: string; value?: string; w?: number }) {
  return (
    <View style={[s.row, { marginBottom: 3, width: w }]}>
      <Text style={[s.label, { width: 70 }]}>{label}:</Text>
      <Text style={[s.field, { flex: 1 }]}>{value || ""}</Text>
    </View>
  );
}

export function JobCardPDF({ jc }: { jc: JobCard }) {
  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="A4" style={s.page}>
        <View style={[s.between, { alignItems: "flex-start" }]}>
          <View>
            <Text style={s.brand}>KellRoss Motors CC</Text>
            <Text style={s.muted}>{BUSINESS.address}</Text>
            <Text style={s.muted}>Tel: {BUSINESS.tel}  |  Fax: {BUSINESS.fax}  |  {BUSINESS.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>JOB CARD</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14 }}>{jc.jobCardNo}</Text>
          </View>
        </View>

        <View style={[s.box, s.row]}>
          <View style={[s.cell, { flex: 1, borderRightWidth: 1, borderColor: "#111" }]}>
            <Field label="Name" value={jc.name} />
            <Field label="Address" value={jc.address} />
            <Field label="Tel" value={jc.tel} />
            <Field label="Cell" value={jc.cell} />
            <Field label="Email" value={jc.email} />
            <Text style={{ marginTop: 4 }}>
              Method of Payment:  {payBox("CASH", jc.methodOfPayment === "cash")}   {payBox("EFT", jc.methodOfPayment === "eft")}   {payBox("DEBIT/CREDIT", jc.methodOfPayment === "card")}
            </Text>
          </View>
          <View style={[s.cell, { flex: 1 }]}>
            <Field label="Date" value={jc.date} />
            <Field label="Model" value={jc.model} />
            <Field label="Registration No" value={jc.registration} />
            <Field label="Km" value={jc.km} />
            <Field label="Vin No" value={jc.vin} />
            <Field label="Fab No" value={jc.fabNo} />
            <Field label="Radio Code" value={jc.radioCode} />
            <Field label="Key Code" value={jc.keyCode} />
          </View>
        </View>

        <View style={s.box}>
          <View style={s.cell}>
            <Text style={s.sectionTitle}>Work to be done:</Text>
            {wrapLines(jc.workToBeDone, 10)}
          </View>
        </View>

        <View style={[s.box, s.row]}>
          <View style={[s.cell, { flex: 1, borderRightWidth: 1, borderColor: "#111" }]}>
            <Field label="Arrival Time" value={jc.arrivalTime} />
            <Text style={[s.label, { marginTop: 4 }]}>Codes:</Text>
            {BUSINESS.damageCodes.map((c) => (
              <Text key={c.code}>{jc.damageCodes.includes(c.code) ? "[x]" : "[ ]"} {c.label} ({c.code})</Text>
            ))}
            <Text style={{ marginTop: 4 }}>Old Parts:  {jc.oldParts === "yes" ? "YES" : jc.oldParts === "no" ? "NO" : "YES / NO"}</Text>
          </View>
          <View style={[s.cell, { flex: 1 }]}>
            <Field label="Departure Time" value={jc.departureTime} />
            <Text style={s.sectionTitle}>Remarks:</Text>
            {wrapLines(jc.remarks, 6)}
          </View>
        </View>

        {BUSINESS.terms.map((t, i) => <Text key={i} style={s.terms}>{t}</Text>)}

        <View style={[s.between, { marginTop: 20 }]}>
          <Text style={s.muted}>Customer Signature ____________________</Text>
          <Text style={s.muted}>Service Advisor Signature ____________________</Text>
        </View>
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        <View style={[s.box, { marginTop: 0 }]}>
          <View style={[s.row, { borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#f0f0f0" }]}>
            <Text style={[s.cell, s.th, { width: 70, borderRightWidth: 1 }]}>Part No.</Text>
            <Text style={[s.cell, s.th, { flex: 1, borderRightWidth: 1 }]}>Parts Description</Text>
            <Text style={[s.cell, s.th, { width: 80, textAlign: "right" }]}>Price</Text>
          </View>
          {padParts(jc).map((p, i) => (
            <View key={i} style={[s.row, { borderBottomWidth: 0.5, borderColor: "#ccc", minHeight: 15 }]}>
              <Text style={[s.cell, { width: 70, borderRightWidth: 1, borderColor: "#ccc" }]}>{p.partNo}</Text>
              <Text style={[s.cell, { flex: 1, borderRightWidth: 1, borderColor: "#ccc" }]}>{p.description}</Text>
              <Text style={[s.cell, { width: 80, textAlign: "right" }]}>{p.price ? money(p.price) : ""}</Text>
            </View>
          ))}
        </View>

        <View style={s.box}>
          <View style={s.cell}>
            <Text style={s.sectionTitle}>Labour:</Text>
            {wrapLines(jc.labour, 10)}
          </View>
        </View>

        <View style={s.box}>
          <View style={s.cell}>
            <Text style={s.sectionTitle}>Report on defects and quote prices to repair and labour times for each</Text>
            {wrapLines(jc.defectsReport, 12)}
          </View>
        </View>

        <View style={[s.box, s.row]}>
          <View style={[s.cell, { flex: 1 }]}>
            <Field label="Hours" value={jc.hours} />
            <Field label="Tech Sign" value={jc.techSign} />
            <Field label="Test Drive" value={jc.testDrive} />
          </View>
          <View style={[s.cell, { flex: 1 }]}>
            <Text>Washed: {jc.washed ? "YES" : "—"}</Text>
            <Text>Vacuumed: {jc.vacuumed ? "YES" : "—"}</Text>
            <Text>Book Stamped: {jc.bookStamped === "yes" ? "Y" : jc.bookStamped === "no" ? "N" : "Y / N"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function payBox(label: string, on: boolean) {
  return `${on ? "[x]" : "[ ]"} ${label}`;
}
function wrapLines(text: string, min: number) {
  const lines = (text || "").split("\n");
  while (lines.length < min) lines.push("");
  return lines.map((l, i) => (
    <Text key={i} style={{ borderBottomWidth: 0.5, borderColor: "#ccc", minHeight: 13, paddingBottom: 1 }}>{l}</Text>
  ));
}
function padParts(jc: JobCard) {
  const parts = [...jc.parts];
  while (parts.length < 12) parts.push({ partNo: "", description: "", price: 0 });
  return parts;
}
