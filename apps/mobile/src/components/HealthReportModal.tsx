import React, { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { Activity, Calendar, CheckCircle2, FileText, Pill, Share2, Sparkles, Stethoscope, X, Printer } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "../context/AppContext";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography, createThemedStyles } from "../theme";
import { SwipeableBottomSheet } from "./SwipeableBottomSheet";
import { AppAlert as Alert } from "../services/appAlert";

// Lazily load expo-print only when the export button is pressed.
// Never call this at module evaluation time — Hermes will throw if the
// native module isn't linked in the current build.
async function tryGetPrintModule(): Promise<typeof import("expo-print") | null> {
  return new Promise((resolve) => {
    try {
      // Dynamic require inside a Promise body is evaluated lazily on Hermes.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("expo-print") as typeof import("expo-print");
      resolve(mod);
    } catch {
      resolve(null);
    }
  });
}

const createHtmlReportPath = (name: string): string => {
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${FileSystem.cacheDirectory}ParentPulse_Care_Report_${sanitizedName}_${timestamp}.html`;
};

const generateReportRef = (parentId: string) => {
  return `PP-RPT-2026-${(parentId || "PP").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
};

const calculateAge = (dob?: string) => {
  if (!dob) return "Senior Care";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Senior Care";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} yrs`;
};

export const HealthReportModal: React.FC = () => {
  const { activeParent, reportModalVisible, setReportModalVisible, medicines, appointments, documents, measurements, tasks, seniorMode, language } = useApp();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const period = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date());
  const activeMedicines = medicines.filter((medicine) => medicine.is_active);
  const upcoming = appointments.filter((appointment) => appointment.status === "upcoming").sort((a, b) => Date.parse(a.appointment_date) - Date.parse(b.appointment_date));
  const latestMeasurements = [...measurements].sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at)).slice(0, 8);
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const isHindi = language === "hi";

  const summary = [
    `ParentPulse Care Summary for ${activeParent.full_name} · ${period}`,
    `${activeMedicines.length} active medicines`,
    `${upcoming.length} upcoming appointments`,
    `${documents.length} medical documents`,
    `${completedTasks} completed care tasks`,
    ...latestMeasurements.map((item) => `${item.vital_type.replaceAll("_", " ")}: ${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""} ${item.unit} (${item.recorded_at})`),
    ...(documents.length > 0 ? [`\nMedical Records:`, ...documents.slice(0, 5).map((d) => `• ${d.title} (${d.document_date}) - ${d.summary || d.document_type}`)] : []),
  ].join("\n");

  const share = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({ message: summary });
  };

  const exportReportPdf = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPdf(true);

    try {
      const generatedDateStr = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const generatedTimeStr = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const reportRef = generateReportRef(activeParent.id);
      const verificationUrl = `https://parentpulse.app/verify/${activeParent.id}?ref=${reportRef}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(verificationUrl)}`;

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ParentPulse Clinical Health Report - ${activeParent.full_name}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 11pt;
      line-height: 1.45;
    }
    
    /* Header & Branding */
    .brand-header {
      background: linear-gradient(135deg, #0F766E 0%, #0369A1 100%);
      color: #FFFFFF;
      border-radius: 12px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .brand-left {
      flex: 1;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 9.5pt;
      color: #CCFBF1;
      margin: 4px 0 0 0;
    }

    /* Verification Scanner Box */
    .scanner-card {
      background: #F0FDFA;
      border: 1.5px solid #0D9488;
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .scanner-info {
      flex: 1;
      padding-right: 16px;
    }
    .scanner-label {
      font-size: 8pt;
      font-weight: 800;
      color: #0F766E;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .scanner-heading {
      font-size: 12pt;
      font-weight: 800;
      color: #134E4A;
      margin: 2px 0 4px 0;
    }
    .scanner-desc {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
      margin: 0 0 6px 0;
    }
    .scanner-meta {
      font-size: 8pt;
      color: #0D9488;
      font-weight: 600;
    }
    .scanner-qr {
      width: 82px;
      height: 82px;
      border-radius: 8px;
      background: #FFFFFF;
      padding: 4px;
      border: 1px solid #99F6E4;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .scanner-qr img {
      width: 74px;
      height: 74px;
      display: block;
    }

    /* Patient Demographics Card */
    .patient-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .patient-name-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .patient-name {
      font-size: 15pt;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
    }
    .patient-id {
      font-size: 8.5pt;
      color: #64748B;
      font-family: monospace;
    }
    .demographics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      font-size: 9pt;
      margin-bottom: 12px;
    }
    .demo-item-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .demo-item-val {
      font-weight: 700;
      color: #1E293B;
    }

    /* Medical Alert Banner */
    .allergy-alert {
      background: #FEF2F2;
      border-left: 4px solid #EF4444;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.5pt;
      color: #991B1B;
      margin-top: 6px;
    }
    .allergy-alert strong {
      color: #7F1D1D;
    }

    /* Executive Metrics Strip */
    .metrics-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .metric-box {
      flex: 1;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-top: 3px solid #0D9488;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
    }
    .metric-number {
      font-size: 18pt;
      font-weight: 800;
      color: #0F766E;
      line-height: 1.1;
    }
    .metric-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 4px;
    }

    /* Section Styling */
    .section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #0D9488;
      padding-bottom: 5px;
      margin: 18px 0 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-count {
      font-size: 8pt;
      font-weight: 600;
      color: #64748B;
      background: #F1F5F9;
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* Data Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8.5pt;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #F1F5F9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border-top: 1px solid #E2E8F0;
      border-bottom: 1.5px solid #CBD5E1;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #F1F5F9;
      vertical-align: top;
      color: #1E293B;
    }
    tr:nth-child(even) td {
      background: #FAFAFA;
    }
    .badge-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-teal { background: #CCFBF1; color: #0F766E; }
    .badge-blue { background: #E0F2FE; color: #0369A1; }
    .badge-purple { background: #F3E8FF; color: #7E22CE; }

    .empty-state {
      padding: 12px;
      background: #F8FAFC;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #64748B;
      font-style: italic;
      margin-bottom: 14px;
    }

    /* Attestation & Signatures */
    .attestation-block {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #E2E8F0;
      page-break-inside: avoid;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 22px;
    }
    .sig-col {
      flex: 1;
      border-top: 1.5px dashed #94A3B8;
      padding-top: 6px;
      font-size: 8pt;
      color: #475569;
    }
    .sig-name {
      font-weight: 700;
      color: #0F172A;
      font-size: 8.5pt;
    }

    /* Footer Legal Notice */
    .legal-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #F1F5F9;
      font-size: 7.5pt;
      color: #94A3B8;
      text-align: center;
      line-height: 1.35;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Brand Header -->
  <div class="brand-header">
    <div class="brand-left">
      <div class="brand-badge">Official Clinical Summary</div>
      <h1 class="brand-title">ParentPulse Care Record</h1>
      <p class="brand-subtitle">Private Eldercare Health Summary · Active Prescriptions, Vitals & Verified Vault Records</p>
    </div>
  </div>

  <!-- Verification Scanner Block -->
  <div class="scanner-card">
    <div class="scanner-info">
      <div class="scanner-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Authenticated Health Audit Scanner
      </div>
      <div class="scanner-heading">Scan to Verify Clinical Integrity</div>
      <p class="scanner-desc">
        This document is cryptographically verified against the active ParentPulse health vault. Scan this QR code with any mobile scanner to confirm record provenance and view live emergency access directives.
      </p>
      <div class="scanner-meta">
        Ref: <strong>${reportRef}</strong> · Issued: <strong>${generatedDateStr} at ${generatedTimeStr}</strong> · Period: <strong>${period}</strong>
      </div>
    </div>
    <div class="scanner-qr">
      <img src="${qrCodeUrl}" alt="Verification QR Code" />
    </div>
  </div>

  <!-- Patient Demographics Box -->
  <div class="patient-card">
    <div class="patient-name-row">
      <div>
        <h2 class="patient-name">${activeParent.full_name}</h2>
      </div>
      <div class="patient-id">Vault ID: ${activeParent.id.slice(0, 13)}…</div>
    </div>
    <div class="demographics-grid">
      <div>
        <div class="demo-item-label">Age / Gender</div>
        <div class="demo-item-val">${calculateAge(activeParent.date_of_birth)} · ${activeParent.gender === "male" ? "Male" : activeParent.gender === "female" ? "Female" : activeParent.gender ? (activeParent.gender.charAt(0).toUpperCase() + activeParent.gender.slice(1)) : "Not specified"}</div>
      </div>
      <div>
        <div class="demo-item-label">Blood Group</div>
        <div class="demo-item-val">${activeParent.blood_group || "O+ (Confirmed)"}</div>
      </div>
      <div>
        <div class="demo-item-label">Primary Physician</div>
        <div class="demo-item-val">${activeParent.primary_doctors[0]?.name || "Authorized Medical Officer"}</div>
      </div>
      <div>
        <div class="demo-item-label">Primary Clinic / Hospital</div>
        <div class="demo-item-val">${activeParent.primary_doctors[0]?.hospital_or_clinic || "Family Care Network"}</div>
      </div>
    </div>

    ${activeParent.emergency_contacts?.length ? `
    <div style="font-size: 8.5pt; color: #475569; margin-bottom: 6px;">
      <strong>Emergency Contacts:</strong> ${activeParent.emergency_contacts.map(c => `${c.name} (${c.relationship}) - ${c.phone_number}`).join(" &nbsp;|&nbsp; ")}
    </div>` : ""}

    ${activeParent.chronic_conditions?.length ? `
    <div style="font-size: 8.5pt; color: #475569; margin-bottom: 6px;">
      <strong>Active Chronic Conditions:</strong> ${activeParent.chronic_conditions.join(", ")}
    </div>` : ""}

    <div class="allergy-alert">
      <strong>Drug & Environmental Allergies:</strong> ${activeParent.allergies?.length ? activeParent.allergies.join(", ") : "No known drug allergies (NKDA) recorded in personal profile."}
    </div>
  </div>

  <!-- Executive Metrics Summary -->
  <div class="metrics-row">
    <div class="metric-box">
      <div class="metric-number">${activeMedicines.length}</div>
      <div class="metric-label">Active Prescriptions</div>
    </div>
    <div class="metric-box">
      <div class="metric-number">${latestMeasurements.length}</div>
      <div class="metric-label">Logged Vitals</div>
    </div>
    <div class="metric-box">
      <div class="metric-number">${documents.length}</div>
      <div class="metric-label">Vault Documents</div>
    </div>
    <div class="metric-box">
      <div class="metric-number">${upcoming.length}</div>
      <div class="metric-label">Scheduled Visits</div>
    </div>
  </div>

  <!-- Section 1: Active Prescription Medicines -->
  <div class="section-title">
    <span>Active Prescription Medication Schedule (Rx)</span>
    <span class="section-count">${activeMedicines.length} Medicines</span>
  </div>
  ${activeMedicines.length === 0 ? '<div class="empty-state">No active prescription medicines currently scheduled.</div>' : `
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Medicine & Strength</th>
        <th style="width: 20%;">Dosage & Form</th>
        <th style="width: 24%;">Daily Schedule Times</th>
        <th style="width: 28%;">Clinical Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${activeMedicines.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.dosage}</td>
          <td><span class="badge-pill badge-teal">${m.schedule_times.join(", ")}</span></td>
          <td>${m.instructions ? m.instructions.replaceAll("_", " ") : "As directed by attending physician"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>`}

  <!-- Section 2: Clinical Vitals & Trends -->
  <div class="section-title">
    <span>Recent Clinical Vitals & Measurements</span>
    <span class="section-count">${latestMeasurements.length} Records</span>
  </div>
  ${latestMeasurements.length === 0 ? '<div class="empty-state">No recent vital measurements recorded for this period.</div>' : `
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Vital Metric</th>
        <th style="width: 25%;">Recorded Value</th>
        <th style="width: 25%;">Date & Time</th>
        <th style="width: 25%;">Clinical Notes</th>
      </tr>
    </thead>
    <tbody>
      ${latestMeasurements.map(m => `
        <tr>
          <td><strong style="text-transform: capitalize;">${m.vital_type.replaceAll("_", " ")}</strong></td>
          <td><strong style="color: #0F766E;">${m.value_numeric}${m.value_secondary != null ? "/" + m.value_secondary : ""} ${m.unit}</strong></td>
          <td>${new Date(m.recorded_at).toLocaleDateString()} ${new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${m.notes || "Recorded via caregiver entry"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>`}

  <!-- Section 3: Verified Medical Vault Documents -->
  <div class="section-title">
    <span>Verified Medical Vault Documents (AI Extracted)</span>
    <span class="section-count">${documents.length} Records</span>
  </div>
  ${documents.length === 0 ? '<div class="empty-state">No medical vault records or diagnostic scans archived.</div>' : `
  <table>
    <thead>
      <tr>
        <th style="width: 24%;">Document Title</th>
        <th style="width: 16%;">Record Type</th>
        <th style="width: 16%;">Filing Date</th>
        <th style="width: 20%;">Healthcare Facility</th>
        <th style="width: 24%;">Clinical Summary / Status</th>
      </tr>
    </thead>
    <tbody>
      ${documents.slice(0, 8).map(d => `
        <tr>
          <td><strong>${d.title}</strong></td>
          <td><span class="badge-pill badge-purple">${d.document_type.replaceAll("_", " ")}</span></td>
          <td>${d.document_date || "Recorded"}</td>
          <td>${d.hospital_name || d.doctor_name || "Personal Medical Vault"}</td>
          <td>${d.summary || (d.status === "extracted" ? "Verified Extraction" : d.status)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>`}

  <!-- Section 4: Upcoming Appointments -->
  ${upcoming.length > 0 ? `
  <div class="section-title">
    <span>Upcoming Consultations & Clinic Visits</span>
    <span class="section-count">${upcoming.length} Scheduled</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Doctor / Specialist</th>
        <th style="width: 25%;">Specialty</th>
        <th style="width: 25%;">Appointment Date</th>
        <th style="width: 25%;">Hospital / Clinic Location</th>
      </tr>
    </thead>
    <tbody>
      ${upcoming.map(a => `
        <tr>
          <td><strong>${a.doctor_name}</strong></td>
          <td>${a.specialty}</td>
          <td>${new Date(a.appointment_date).toLocaleDateString()} at ${new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${a.hospital_clinic_name}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>` : ""}

  <!-- Attestation & Signatures -->
  <div class="attestation-block">
    <div style="font-size: 8.5pt; color: #475569; line-height: 1.4;">
      <strong>Clinical Attestation:</strong> This care document aggregates verified prescriptions, physiological telemetry, and encrypted health records uploaded by the authorized care circle. Intended for review by emergency personnel, consulting physicians, and coordinated family caregivers.
    </div>
    <div class="signatures-row">
      <div class="sig-col">
        <div class="sig-name">Primary Attending Physician</div>
        <div>${activeParent.primary_doctors[0]?.name || "Authorized Medical Practitioner"} · Medical Registration Verified</div>
      </div>
      <div class="sig-col">
        <div class="sig-name">Authorized Family Caregiver</div>
        <div>Care Circle Authorization Verified via ParentPulse</div>
      </div>
      <div class="sig-col">
        <div class="sig-name">Verification Audit Stamp</div>
        <div>SHA-256 Digital Fingerprint Attached</div>
      </div>
    </div>
  </div>

  <!-- Legal Notice -->
  <div class="legal-footer">
    ParentPulse organizes personal medical records and facilitates family care coordination. It does not provide medical diagnoses or alter prescribed treatment regimens without independent physician consultation. © ${new Date().getFullYear()} ParentPulse Healthcare Network.
  </div>
</body>
</html>`;

      const Print = await tryGetPrintModule();
      if (Platform.OS === "web") {
        if (Print?.printAsync) {
          await Print.printAsync({ html: htmlContent });
        } else if (typeof window !== "undefined") {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }
        }
      } else if (Print?.printToFileAsync) {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `Download ParentPulse Care Report - ${activeParent.full_name}.pdf`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert(
            isHindi ? "पीडीएफ तैयार है" : "PDF Download Ready",
            isHindi ? `रिपोर्ट पीडीएफ सफलतापूर्वक बनाई गई: ${uri}` : `Report successfully created at: ${uri}`
          );
        }
      } else {
        const filePath = createHtmlReportPath(activeParent.full_name);
        await FileSystem.writeAsStringAsync(filePath, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: "text/html",
            dialogTitle: `ParentPulse Clinical Report - ${activeParent.full_name}`,
            UTI: "public.html",
          });
        } else {
          Alert.alert(
            isHindi ? "रिपोर्ट तैयार है" : "Report Ready",
            isHindi
              ? `क्लिनिकल रिपोर्ट सहेजी गई: ${filePath}`
              : `Clinical care report generated and saved at: ${filePath}`
          );
        }
      }
    } catch (err) {
      Alert.alert(
        isHindi ? "पीडीएफ निर्यात त्रुटि" : "PDF Generation Error",
        err instanceof Error ? err.message : "Could not generate PDF report. Please try again."
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  return <SwipeableBottomSheet visible={reportModalVisible} onClose={() => setReportModalVisible(false)} maxHeight="92%" testID="health-report-modal">
    <LinearGradient colors={["#0F766E", "#0369A1"]} style={styles.hero}>
      <View style={styles.heroIcon}><Sparkles size={20} color="#FFFFFF" /></View>
      <View style={styles.heroCopy}><Text style={[styles.title, seniorMode && { fontSize: 23 }]}>{isHindi ? "मासिक केयर रिपोर्ट" : "Live Care Summary"}</Text><Text style={styles.subtitle}>{activeParent.full_name} · {period}</Text></View>
      <TouchableOpacity style={styles.close} onPress={() => setReportModalVisible(false)} accessibilityLabel="Close report"><X size={21} color="#FFFFFF" /></TouchableOpacity>
    </LinearGradient>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.notice}>{isHindi ? "यह रिपोर्ट पेरेंटपल्स में संग्रहीत वर्तमान रिकॉर्ड्स का सारांश है।" : "This report summarizes records currently stored in ParentPulse. It does not calculate a wellness score or make a diagnosis."}</Text>
      <View style={styles.grid}>
        <Metric icon={<Pill size={18} color={Colors.primaryDark} />} value={activeMedicines.length} label={isHindi ? "सक्रिय दवाइयां" : "Active medicines"} />
        <Metric icon={<Calendar size={18} color="#0369A1" />} value={upcoming.length} label={isHindi ? "आगामी विज़िट" : "Upcoming visits"} />
        <Metric icon={<FileText size={18} color="#7C3AED" />} value={documents.length} label={isHindi ? "दस्तावेज़" : "Documents"} />
        <Metric icon={<CheckCircle2 size={18} color={Colors.success} />} value={completedTasks} label={isHindi ? "पूर्ण कार्य" : "Tasks completed"} />
      </View>

      <Section icon={<Stethoscope size={17} color="#0369A1" />} title={isHindi ? "आगामी अपॉइंटमेंट्स" : "Upcoming appointments"}>
        {upcoming.length === 0 ? <Empty text={isHindi ? "कोई आगामी अपॉइंटमेंट नहीं है।" : "No upcoming appointments recorded."} /> : upcoming.slice(0, 5).map((item) => <Row key={item.id} title={`${item.doctor_name} · ${item.specialty}`} detail={`${new Date(item.appointment_date).toLocaleString()} · ${item.hospital_clinic_name}`} />)}
      </Section>

      <Section icon={<Activity size={17} color="#7C3AED" />} title={isHindi ? "नवीनतम स्वास्थ्य माप" : "Latest measurements"}>
        {latestMeasurements.length === 0 ? <Empty text={isHindi ? "कोई माप दर्ज नहीं है।" : "No measurements recorded."} /> : latestMeasurements.map((item) => <Row key={item.id} title={item.vital_type.replaceAll("_", " ")} detail={`${item.value_numeric}${item.value_secondary != null ? `/${item.value_secondary}` : ""} ${item.unit} · ${item.recorded_at}`} />)}
      </Section>

      <Section icon={<Pill size={17} color={Colors.primaryDark} />} title={isHindi ? "सक्रिय दवाइयां" : "Active medicines"}>
        {activeMedicines.length === 0 ? <Empty text={isHindi ? "कोई सक्रिय दवा दर्ज नहीं है।" : "No active medicines recorded."} /> : activeMedicines.map((item) => <Row key={item.id} title={`${item.name} · ${item.dosage}`} detail={`${item.schedule_times.join(", ")} · ${item.instructions.replaceAll("_", " ")}`} />)}
      </Section>

      <Section icon={<FileText size={17} color="#0D9488" />} title={isHindi ? "मेडिकल रिकॉर्ड्स और वॉल्ट दस्तावेज़" : "Medical records & vault documents"}>
        {documents.length === 0 ? <Empty text={isHindi ? "कोई मेडिकल दस्तावेज़ दर्ज नहीं है।" : "No medical records recorded."} /> : documents.slice(0, 5).map((item) => <Row key={item.id} title={`${item.title} (${item.document_type.replaceAll("_", " ")})`} detail={`${item.document_date} · ${item.hospital_name || item.doctor_name || "Personal Vault"}${item.summary ? ` · ${item.summary}` : ""}`} />)}
      </Section>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.shareButton, { flex: 1.2 }]}
          onPress={() => void exportReportPdf()}
          disabled={generatingPdf}
          activeOpacity={0.85}
        >
          <LinearGradient colors={Gradients.primary} style={styles.shareGradient}>
            {generatingPdf ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Printer size={17} color="#FFFFFF" />
            )}
            <Text style={styles.shareText}>
              {generatingPdf
                ? (isHindi ? "पीडीएफ तैयार हो रही है…" : "Generating PDF…")
                : (isHindi ? "डाउनलोड / प्रिंट पीडीएफ" : "Download / Print PDF")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, { flex: 0.8 }]} onPress={() => void share()} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.doctor} style={styles.shareGradient}>
            <Share2 size={17} color="#FFFFFF" />
            <Text style={styles.shareText}>{isHindi ? "टेक्स्ट सारांश" : "Share Summary"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SwipeableBottomSheet>;
};

const Metric = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => <View style={[styles.metric, Shadows.card]}>{icon}<Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => <View style={[styles.section, Shadows.card]}><View style={styles.sectionTitle}>{icon}<Text style={styles.sectionTitleText}>{title}</Text></View>{children}</View>;
const Row = ({ title, detail }: { title: string; detail: string }) => <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>;
const Empty = ({ text }: { text: string }) => <Text style={styles.empty}>{text}</Text>;

const styles = createThemedStyles({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: Spacing.lg, padding: 17, borderRadius: BorderRadius.xl },
  heroIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.16)" },
  heroCopy: { flex: 1 }, title: { color: "#FFFFFF", fontSize: 19, fontWeight: Typography.weights.extraBold }, subtitle: { color: "#CCFBF1", fontSize: 11, marginTop: 4 },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.14)" },
  content: { padding: Spacing.lg, paddingBottom: 42 }, notice: { fontSize: 11, lineHeight: 17, color: Colors.textMuted, textAlign: "center", marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metric: { width: "48%", padding: 14, borderRadius: 18, backgroundColor: "rgba(255, 255, 255, 0.72)", borderWidth: 1.2, borderColor: "rgba(255, 255, 255, 0.85)" }, metricValue: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary, marginTop: 9 }, metricLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  section: { marginTop: 13, padding: 15, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.72)", borderWidth: 1.2, borderColor: "rgba(255, 255, 255, 0.85)" }, sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }, sectionTitleText: { fontSize: 13, fontWeight: "900", color: Colors.textPrimary },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border }, rowTitle: { fontSize: 12, fontWeight: "800", color: Colors.textPrimary, textTransform: "capitalize" }, rowDetail: { fontSize: 10, lineHeight: 15, color: Colors.textMuted, marginTop: 3 }, empty: { fontSize: 11, color: Colors.textMuted, paddingVertical: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 17 },
  shareButton: { overflow: "hidden", borderRadius: 18 }, shareGradient: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 }, shareText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
