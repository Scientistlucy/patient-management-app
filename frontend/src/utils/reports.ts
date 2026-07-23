import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportRow = {
  unique: string;
  name: string;
  gender: string;
  age: number;
  visit_date: string | null;
  height: number | null;
  weight: number | null;
  bmi: string | null;
  status: string;
};

export type ReportStats = {
  total: number;
  underweight: number;
  normal: number;
  overweight: number;
  no_vitals: number;
  average_bmi: number | null;
};

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function fileStamp(visitDate: string) {
  return `${visitDate || "all"}-${new Date().toISOString().slice(0, 10)}`;
}

export function downloadPatientCsv(params: {
  rows: ReportRow[];
  stats: ReportStats;
  visitDate: string;
}) {
  const header = [
    "Patient Id",
    "Name",
    "Gender",
    "Age",
    "Visit Date",
    "Height (cm)",
    "Weight (kg)",
    "BMI",
    "BMI Status",
  ];

  const lines = [
    `# Patient Chart report`,
    `# Generated,${new Date().toISOString()}`,
    `# Visit date filter,${params.visitDate || "All"}`,
    `# Total in view,${params.stats.total}`,
    `# Underweight,${params.stats.underweight}`,
    `# Normal,${params.stats.normal}`,
    `# Overweight,${params.stats.overweight}`,
    `# No vitals,${params.stats.no_vitals}`,
    `# Average BMI,${params.stats.average_bmi ?? ""}`,
    "",
    header.join(","),
    ...params.rows.map((row) =>
      [
        row.unique,
        row.name,
        row.gender,
        row.age,
        row.visit_date,
        row.height,
        row.weight,
        row.bmi,
        row.status,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `patient-report-${fileStamp(params.visitDate)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPatientPdf(params: {
  rows: ReportRow[];
  stats: ReportStats;
  visitDate: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const marginX = 40;

  doc.setFillColor(10, 61, 64);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, "F");
  doc.setTextColor(245, 255, 253);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Patient Chart", marginX, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Census report", marginX, 44);

  doc.setTextColor(10, 61, 64);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 78);
  doc.text(`Visit date filter: ${params.visitDate || "All"}`, marginX, 94);

  const summary = [
    `Patients: ${params.stats.total}`,
    `Normal: ${params.stats.normal}`,
    `Overweight: ${params.stats.overweight}`,
    `Underweight: ${params.stats.underweight}`,
    `No vitals: ${params.stats.no_vitals}`,
    `Avg BMI: ${params.stats.average_bmi ?? "—"}`,
  ].join("   |   ");

  doc.setFontSize(9);
  doc.setTextColor(90, 107, 105);
  doc.text(summary, marginX, 112);

  autoTable(doc, {
    startY: 128,
    head: [["Patient Id", "Name", "Gender", "Age", "Visit", "BMI", "Status"]],
    body: params.rows.map((row) => [
      row.unique,
      row.name,
      row.gender,
      String(row.age),
      row.visit_date ?? "—",
      row.bmi ?? "—",
      row.status,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: [10, 61, 64],
      lineColor: [197, 208, 206],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [10, 61, 64],
      textColor: [245, 255, 253],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [247, 251, 250],
    },
    margin: { left: marginX, right: marginX },
  });

  doc.save(`patient-report-${fileStamp(params.visitDate)}.pdf`);
}
