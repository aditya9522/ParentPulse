// apps/mobile/src/screens/ExpensesScreen.tsx
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import {
  Receipt,
  Shield,
  Plus,
  CheckCircle2,
  Pill,
  Stethoscope,
  FlaskConical,
  X,
  Phone,
  TrendingUp,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../context/AppContext";
import { HealthcareExpense, InsurancePolicy } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, Glass } from "../theme";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";

export const ExpensesScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    activeParent,
    expenses,
    addExpense,
    deleteExpense,
    insurance,
    addInsurance,
    deleteInsurance,
    seniorMode,
    language,
  } = useApp();

  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"expenses" | "insurance">("expenses");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Add Expense Modal State
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState<HealthcareExpense["category"]>("medicine");
  const [expProvider, setExpProvider] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [expReimbursed, setExpReimbursed] = useState(false);

  // Add Insurance Modal State
  const [addInsModalVisible, setAddInsModalVisible] = useState(false);
  const [insProvider, setInsProvider] = useState("");
  const [insPolicyNum, setInsPolicyNum] = useState("");
  const [insPlanName, setInsPlanName] = useState("");
  const [insCoverage, setInsCoverage] = useState("1500000");
  const [insExpiry, setInsExpiry] = useState("2027-03-31");
  const [insTpa, setInsTpa] = useState("1800-425-2255");
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const handleDeleteExpense = (id: string, title: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isHindi ? "खर्च हटाएं?" : "Delete Expense Record?",
      isHindi
        ? `क्या आप निश्चित हैं कि आप "${title}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "हटाएं" : "Delete",
          style: "destructive",
          onPress: () => {
            deleteExpense(id);
          },
        },
      ]
    );
  };

  const handleDeleteInsurance = (id: string, name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isHindi ? "पॉलिसी हटाएं?" : "Delete Health Policy?",
      isHindi
        ? `क्या आप निश्चित हैं कि आप "${name}" को हटाना चाहते हैं?`
        : `Are you sure you want to remove "${name}" from active policies?`,
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "हटाएं" : "Delete",
          style: "destructive",
          onPress: () => {
            deleteInsurance(id);
          },
        },
      ]
    );
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch { }
  };

  const categories = [
    { id: "all", label: isHindi ? "सभी खर्च" : "All Expenses" },
    { id: "medicine", label: isHindi ? "दवाइयां" : "Medicines" },
    { id: "doctor", label: isHindi ? "परामर्श" : "Consultations" },
    { id: "lab", label: isHindi ? "जांच (लैब)" : "Diagnostics" },
    { id: "hospital", label: isHindi ? "अस्पताल" : "Hospital Care" },
    { id: "insurance", label: isHindi ? "बीमा" : "Insurance" },
  ];

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory === "all") return true;
    return e.category === selectedCategory;
  });

  const totalMonthlySpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = () => {
    if (!expTitle.trim() || !expAmount.trim()) {
      Alert.alert(isHindi ? "विवरण आवश्यक है" : "Details Required", isHindi ? "कृपया शीर्षक और राशि दर्ज करें।" : "Please enter expense title and amount.");
      return;
    }

    const normalizedAmount = expAmount.replace(/[₹,\s]/g, "");
    const amt = Number(normalizedAmount);
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount) || !Number.isFinite(amt) || amt <= 0) {
      Alert.alert(isHindi ? "अमान्य राशि" : "Invalid Amount", isHindi ? "कृपया सही राशि दर्ज करें।" : "Please enter a valid amount.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const newExp: HealthcareExpense = {
      id: Crypto.randomUUID(),
      parent_id: activeParent.id,
      family_id: activeParent.family_id,
      title: expTitle.trim(),
      category: expCategory,
      amount: amt,
      currency: "INR",
      expense_date: new Date().toISOString().split("T")[0],
      provider_name: expProvider.trim() || undefined,
      notes: expNotes.trim() || undefined,
      is_reimbursed: expReimbursed,
      created_at: new Date().toISOString(),
    };

    addExpense(newExp);
    setExpTitle("");
    setExpAmount("");
    setExpProvider("");
    setExpNotes("");
    setAddExpenseModalVisible(false);
  };

  const handleCreateInsurance = () => {
    if (!insProvider.trim() || !insPolicyNum.trim() || !insPlanName.trim()) {
      Alert.alert(isHindi ? "विवरण आवश्यक है" : "Details Required", isHindi ? "कृपया बीमा प्रदाता और पॉलिसी नंबर दर्ज करें।" : "Please enter insurance provider and policy number.");
      return;
    }

    const coverageAmount = Number(insCoverage.replace(/[,\s]/g, ""));
    const expiryDate = new Date(`${insExpiry}T00:00:00`);
    if (!Number.isFinite(coverageAmount) || coverageAmount <= 0) {
      Alert.alert(isHindi ? "अमान्य कवरेज" : "Invalid Coverage", isHindi ? "कृपया सही कवरेज राशि दर्ज करें।" : "Please enter a valid coverage amount.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(insExpiry) || Number.isNaN(expiryDate.getTime()) || expiryDate.toISOString().slice(0, 10) !== insExpiry) {
      Alert.alert(isHindi ? "अमान्य समाप्ति तिथि" : "Invalid Expiry Date", isHindi ? "कृपया YYYY-MM-DD प्रारूप में सही तिथि दर्ज करें।" : "Enter a real date in YYYY-MM-DD format.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const newPolicy: InsurancePolicy = {
      id: Crypto.randomUUID(),
      parent_id: activeParent.id,
      family_id: activeParent.family_id,
      provider: insProvider.trim(),
      policy_number: insPolicyNum.trim(),
      plan_name: insPlanName.trim(),
      coverage_amount: coverageAmount,
      currency: "INR",
      expiry_date: insExpiry,
      tpa_cashless_helpline: insTpa.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    addInsurance(newPolicy);
    setInsProvider("");
    setInsPolicyNum("");
    setInsPlanName("");
    setInsCoverage("");
    setInsExpiry("");
    setAddInsModalVisible(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medicine":
        return <Pill size={16} color={Colors.primaryDark} />;
      case "doctor":
        return <Stethoscope size={16} color={Colors.secondaryDark} />;
      case "lab":
        return <FlaskConical size={16} color="#7C3AED" />;
      default:
        return <Receipt size={16} color={Colors.textSecondary} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, seniorMode && styles.seniorHeaderTitle]}>
              {isHindi ? "स्वास्थ्य खर्च व बीमा" : "Expenses & Insurance"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isHindi ? `${activeParent.full_name} के मेडिकल बिल व पॉलिसी ट्रैक करें` : `Manage Medical Receipts & Policies for ${activeParent.full_name}`}
            </Text>
          </View>
        </View>

        {/* Switcher Tab Buttons */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "expenses" && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("expenses");
            }}
          >
            <Receipt size={16} color={activeTab === "expenses" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === "expenses" && styles.segmentTextActive]}>
              {isHindi ? `मेडिकल खर्च (${expenses.length})` : `Bills & Expenses (${expenses.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "insurance" && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("insurance");
            }}
          >
            <Shield size={16} color={activeTab === "insurance" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === "insurance" && styles.segmentTextActive]}>
              {isHindi ? `स्वास्थ्य बीमा (${insurance.length})` : `Insurance Policies (${insurance.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "expenses" ? (
          <>
            {/* Monthly Total Spend Hero Card */}
            <LinearGradient
              colors={Gradients.primaryHero}
              style={[styles.spendCard, Shadows.cardElevated]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.spendTop}>
                <View>
                  <Text style={styles.spendLabel}>
                    {isHindi ? "सितंबर 2026 कुल मेडिकल खर्च" : "September 2026 Healthcare Expenses"}
                  </Text>
                  <Text style={styles.spendValue}>
                    ₹{totalMonthlySpend.toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={styles.spendBadge}>
                  <TrendingUp size={14} color="#D1FAE5" />
                  <Text style={styles.spendBadgeText}>{isHindi ? "पारिवारिक समन्वयित" : "Family Coordinated"}</Text>
                </View>
              </View>

              <Text style={styles.spendSummary}>
                {isHindi
                  ? "दवाइयां (₹3,450) • डॉक्टर परामर्श (₹1,500) • पैथोलॉजी लैब (₹2,200)"
                  : "Prescriptions (₹3,450) • Doctor Visits (₹1,500) • Diagnostic Labs (₹2,200)"}
              </Text>
            </LinearGradient>

            {/* Filter Pills and Add Expense Action */}
            <View style={styles.actionRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.filterPill, selectedCategory === c.id && styles.filterPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedCategory(c.id);
                    }}
                  >
                    <Text style={[styles.filterPillText, selectedCategory === c.id && styles.filterPillTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setAddExpenseModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{isHindi ? "बिल जोड़ें" : "Add Bill"}</Text>
              </TouchableOpacity>
            </View>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <View style={styles.emptyStateIconCircle}>
                  <Receipt size={36} color={Colors.primary} />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {isHindi ? "कोई मेडिकल खर्च नहीं मिला" : "No Medical Expenses Logged"}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {isHindi
                    ? "डॉक्टर परामर्श, दवाओं और लैब टेस्ट के बिल व रसीदें यहाँ दर्ज करें।"
                    : "Log doctor consultations, prescription receipts, and lab invoices to track health spending."}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    setAddExpenseModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>{isHindi ? "पहला बिल जोड़ें" : "Add First Bill"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredExpenses.map((exp) => (
                <View key={exp.id} style={[styles.expenseCard, Shadows.card]}>
                  <View style={styles.expenseIconBox}>
                    {getCategoryIcon(exp.category)}
                  </View>

                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseTitleRow}>
                      <Text style={styles.expenseTitle} numberOfLines={1}>{exp.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.expenseAmount}>₹{exp.amount.toLocaleString("en-IN")}</Text>
                        <TouchableOpacity
                          style={styles.cardDeleteBtn}
                          onPress={() => handleDeleteExpense(exp.id, exp.title)}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete Expense"
                        >
                          <Trash2 size={13} color={Colors.emergencyDark} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.expenseProvider}>
                      {exp.provider_name ? `${exp.provider_name} • ` : ""}{exp.expense_date}
                    </Text>

                    {exp.notes && (
                      <Text style={styles.expenseNotes} numberOfLines={2}>
                        {exp.notes}
                      </Text>
                    )}

                    <View style={styles.expenseBottomRow}>
                      <View style={[styles.reimbursedPill, exp.is_reimbursed && styles.reimbursedPillDone]}>
                        <Text style={[styles.reimbursedPillText, exp.is_reimbursed && styles.reimbursedPillTextDone]}>
                          {exp.is_reimbursed
                            ? (isHindi ? "✓ बीमा द्वारा प्रतिपूर्ति" : "✓ Insurance Reimbursed")
                            : (isHindi ? "लंबित प्रतिपूर्ति" : "Out of Pocket")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* Insurance Policies Section */}
            <View style={styles.insHeaderRow}>
              <View>
                <Text style={styles.insTitle}>{isHindi ? "सक्रिय बीमा पॉलिसियां" : "Active Health Policies"}</Text>
                <Text style={styles.insSub}>{isHindi ? "कैशलेस हॉस्पिटलाइजेशन एवं दावा सहायता" : "Cashless Hospitalization Network & TPA Desk"}</Text>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setAddInsModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>{isHindi ? "पॉलिसी" : "Policy"}</Text>
              </TouchableOpacity>
            </View>

            {insurance.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <View style={styles.emptyStateIconCircle}>
                  <Shield size={36} color={Colors.secondary} />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {isHindi ? "कोई सक्रिय बीमा पॉलिसी नहीं" : "No Health Insurance Policies"}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {isHindi
                    ? "कैशलेस अस्पताल प्रवेश और दावा सहायता के लिए पॉलिसी नंबर और TPA हेल्पलाईन दर्ज करें।"
                    : "Record policy numbers, sum insured, and cashless TPA helplines for instant hospital admission."}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    setAddInsModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>{isHindi ? "पॉलिसी जोड़ें" : "Add Health Policy"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              insurance.map((policy) => (
                <View key={policy.id} style={[styles.insuranceCard, Shadows.card]}>
                  <LinearGradient colors={["#0F766E", "#0369A1"]} style={styles.insCardHeader}>
                    <View style={styles.insCardHeaderTop}>
                      <Shield size={20} color="#FFFFFF" />
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>ACTIVE</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.insDeleteBtn}
                          onPress={() => handleDeleteInsurance(policy.id, `${policy.provider} - ${policy.plan_name}`)}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete Insurance Policy"
                        >
                          <Trash2 size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.insProviderName}>{policy.provider}</Text>
                    <Text style={styles.insPlanName}>{policy.plan_name}</Text>
                  </LinearGradient>

                  <View style={styles.insCardBody}>
                    <View style={styles.insGrid}>
                      <View style={styles.insGridItem}>
                        <Text style={styles.insGridLabel}>{isHindi ? "पॉलिसी नंबर" : "Policy Number"}</Text>
                        <Text style={styles.insGridValue}>{policy.policy_number}</Text>
                      </View>

                      <View style={styles.insGridItem}>
                        <Text style={styles.insGridLabel}>{isHindi ? "बीमित राशि" : "Sum Insured"}</Text>
                        <Text style={styles.insGridValue}>₹{(policy.coverage_amount / 100000).toFixed(1)} Lakhs</Text>
                      </View>

                      <View style={styles.insGridItem}>
                        <Text style={styles.insGridLabel}>{isHindi ? "नवीनीकरण तिथि" : "Expiry / Renewal"}</Text>
                        <Text style={styles.insGridValue}>{policy.expiry_date}</Text>
                      </View>

                      <View style={styles.insGridItem}>
                        <Text style={styles.insGridLabel}>{isHindi ? "TPA कैशलेस हेल्प" : "TPA Helpline"}</Text>
                        <Text style={styles.insGridValue}>{policy.tpa_cashless_helpline || "1800-425-2255"}</Text>
                      </View>
                    </View>

                    {policy.notes && (
                      <Text style={styles.insNotes}>
                        <Text style={{ fontWeight: "700" }}>Note: </Text>{policy.notes}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.tpaCallBtn}
                      onPress={() => Linking.openURL(`tel:${(policy.tpa_cashless_helpline || "1800-425-2255").replace(/[^0-9]/g, "")}`)}
                      activeOpacity={0.8}
                    >
                      <Phone size={14} color="#FFFFFF" />
                      <Text style={styles.tpaCallBtnText}>{isHindi ? "TPA कैशलेस डेस्क को कॉल करें" : "Call TPA Cashless Desk"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <SwipeableBottomSheet
        visible={addExpenseModalVisible}
        onClose={() => setAddExpenseModalVisible(false)}
        maxHeight="90%"
        containerStyle={styles.modalCard}
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isHindi ? "नया मेडिकल खर्च दर्ज करें" : "Log Medical Expense"}</Text>
            <TouchableOpacity onPress={() => setAddExpenseModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            <Text style={styles.inputLabel}>{isHindi ? "खर्च शीर्षक *" : "Title *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dr. Verma Cardiology Consultation"
              placeholderTextColor="#94A3B8"
              value={expTitle}
              onChangeText={setExpTitle}
            />

            <Text style={styles.inputLabel}>{isHindi ? "राशि (₹) *" : "Amount (INR) *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1500"
              placeholderTextColor="#94A3B8"
              value={expAmount}
              onChangeText={setExpAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>{isHindi ? "श्रेणी" : "Category"}</Text>
            <View style={styles.categorySelectorRow}>
              {(["medicine", "doctor", "lab", "hospital"] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, expCategory === cat && styles.catBtnActive]}
                  onPress={() => setExpCategory(cat)}
                >
                  <Text style={[styles.catBtnText, expCategory === cat && styles.catBtnTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{isHindi ? "अस्पताल / दुकान का नाम" : "Provider / Pharmacy Name"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provider or pharmacy name"
              placeholderTextColor="#94A3B8"
              value={expProvider}
              onChangeText={setExpProvider}
            />

            <Text style={styles.inputLabel}>{isHindi ? "विवरण" : "Notes"}</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              placeholder="Optional notes..."
              placeholderTextColor="#94A3B8"
              value={expNotes}
              onChangeText={setExpNotes}
              multiline
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setExpReimbursed(!expReimbursed)}
            >
              <View style={[styles.checkboxBox, expReimbursed && styles.checkboxBoxChecked]}>
                {expReimbursed && <CheckCircle2 size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                {isHindi ? "बीमा द्वारा दावा/प्रतिपूर्ति प्राप्त" : "Claimed / Reimbursed by Insurance"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateExpense} activeOpacity={0.8}>
              <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
                <Text style={styles.submitText}>{isHindi ? "खर्च सहेजें" : "Save Expense"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>

      {/* Add Insurance Modal */}
      <SwipeableBottomSheet
        visible={addInsModalVisible}
        onClose={() => setAddInsModalVisible(false)}
        maxHeight="90%"
        containerStyle={styles.modalCard}
      >
        <View style={styles.sheetInnerPadding}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isHindi ? "नई बीमा पॉलिसी जोड़ें" : "Add Health Insurance Policy"}</Text>
            <TouchableOpacity onPress={() => setAddInsModalVisible(false)}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            <Text style={styles.inputLabel}>{isHindi ? "बीमा कंपनी *" : "Insurance Provider *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Star Health / Max Bupa / Care Health"
              placeholderTextColor="#94A3B8"
              value={insProvider}
              onChangeText={setInsProvider}
            />

            <Text style={styles.inputLabel}>{isHindi ? "पॉलिसी नंबर *" : "Policy Number *"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SH-SENIOR-98214"
              placeholderTextColor="#94A3B8"
              value={insPolicyNum}
              onChangeText={setInsPolicyNum}
            />

            <Text style={styles.inputLabel}>{isHindi ? "योजना का नाम" : "Plan Name"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Senior Citizen Red Carpet"
              placeholderTextColor="#94A3B8"
              value={insPlanName}
              onChangeText={setInsPlanName}
            />

            <Text style={styles.inputLabel}>{isHindi ? "बीमित राशि (₹)" : "Sum Insured (INR)"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1500000"
              placeholderTextColor="#94A3B8"
              value={insCoverage}
              onChangeText={setInsCoverage}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>{isHindi ? "समाप्ति / नवीनीकरण तिथि" : "Expiry / Renewal Date"}</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowExpiryPicker(true)}
              activeOpacity={0.8}
            >
              <CalendarIcon size={16} color={Colors.primary} />
              <Text style={styles.datePickerBtnText}>{insExpiry || "Select Date"}</Text>
            </TouchableOpacity>

            {showExpiryPicker && (
              <DateTimePicker
                value={new Date(insExpiry || Date.now())}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowExpiryPicker(false);
                  if (selectedDate) {
                    setInsExpiry(selectedDate.toISOString().slice(0, 10));
                  }
                }}
              />
            )}

            <Text style={styles.inputLabel}>{isHindi ? "TPA कैशलेस हेल्पलाइन" : "TPA Helpline Number"}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1800-425-2255"
              placeholderTextColor="#94A3B8"
              value={insTpa}
              onChangeText={setInsTpa}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateInsurance} activeOpacity={0.8}>
              <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
                <Text style={styles.submitText}>{isHindi ? "पॉलिसी सहेजें" : "Save Insurance Policy"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SwipeableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    paddingTop: 12,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
  },
  backButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  seniorHeaderTitle: {
    fontSize: Typography.seniorSizes.lg,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginTop: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    ...Shadows.subtle,
  },
  segmentText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  spendCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  spendTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  spendLabel: {
    fontSize: Typography.sizes.xs,
    color: "#CCFBF1",
    fontWeight: Typography.weights.semibold,
  },
  spendValue: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
    marginTop: 4,
  },
  spendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  spendBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  spendSummary: {
    fontSize: Typography.sizes.xxs,
    color: "#E2E8F0",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  pillsScroll: {
    gap: 6,
    paddingRight: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
  },
  filterPillTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  expenseCard: {
    ...Glass.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  expenseProvider: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expenseNotes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  expenseBottomRow: {
    marginTop: 8,
  },
  reimbursedPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceAlt,
  },
  reimbursedPillDone: {
    backgroundColor: Colors.successLight,
  },
  reimbursedPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
  },
  reimbursedPillTextDone: {
    color: Colors.successDark,
  },
  insHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  insTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  insSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  insuranceCard: {
    ...Glass.card,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insCardHeader: {
    padding: Spacing.md,
  },
  insCardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  activePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: Typography.weights.bold,
  },
  insProviderName: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
  },
  insPlanName: {
    color: "#CCFBF1",
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  insCardBody: {
    padding: Spacing.md,
  },
  insGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  insGridItem: {
    width: "47%",
  },
  insGridLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  insGridValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  insNotes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  tpaCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.secondaryDark,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginTop: 12,
  },
  tpaCallBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categorySelectorRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
  },
  catBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catBtnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  catBtnTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
  },
  modalSubmitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  sheetInnerPadding: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.lg,
  },
  cardDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.emergencyLight,
    justifyContent: "center",
    alignItems: "center",
  },
  insDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: Spacing.lg,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
});
