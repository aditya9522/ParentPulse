// apps/mobile/src/screens/FamilyCareScreen.tsx
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
  Image,
} from "react-native";
import { AppAlert as Alert } from "../services/appAlert";
import {
  Users,
  CheckCircle2,
  Plus,
  Calendar,
  User,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  Check,
  X,
  UserPlus,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useApp } from "../context/AppContext";
import { CareTask, TaskPriority, UserRole } from "../types";
import { Colors, Typography, Spacing, Shadows, BorderRadius, Gradients, Glass } from "../theme";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SwipeableBottomSheet } from "../components/SwipeableBottomSheet";
import { apiClient } from "../api/client";

export const FamilyCareScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    activeParent,
    tasks,
    addTask,
    toggleTaskCompleted,
    deleteTask,
    familyMembers,
    refreshData,
    seniorMode,
    language,
  } = useApp();

  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // Add Task Modal State
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState(familyMembers[0]?.name || "");

  // Invite Member Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRelation, setMemberRelation] = useState("Caregiver");
  const [memberRole] = useState<UserRole>("caregiver");
  const [canMeds, setCanMeds] = useState(true);
  const [canAppts, setCanAppts] = useState(true);
  const [canDocs, setCanDocs] = useState(false);
  const [canBrief, setCanBrief] = useState(false);
  const [canLoc, setCanLoc] = useState(true);

  // Delete Task Modal State
  const [taskToDelete, setTaskToDelete] = useState<CareTask | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch { }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "pending") return t.status === "pending" || t.status === "in_progress";
    if (taskFilter === "completed") return t.status === "completed";
    return true;
  });

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert(isHindi ? "शीर्षक आवश्यक है" : "Title Required", isHindi ? "कृपया कार्य का नाम लिखें।" : "Please enter a task title.");
      return;
    }
    if (taskDueDate && !Number.isFinite(Date.parse(taskDueDate))) {
      Alert.alert("Invalid due date", "Use an ISO date and time, for example 2026-10-05T10:00:00Z.");
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const newTask: CareTask = {
      id: Crypto.randomUUID(),
      parent_id: activeParent.id,
      family_id: activeParent.family_id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      priority: taskPriority,
      status: "pending",
      due_date: taskDueDate || undefined,
      assigned_to_name: taskAssignee,
      assigned_to_user_id: familyMembers.find((member) => member.name === taskAssignee)?.user_id,
      created_at: new Date().toISOString(),
    };

    addTask(newTask);
    setTaskTitle("");
    setTaskDesc("");
    setAddTaskModalVisible(false);
  };

  const handleInviteMember = async () => {
    if (!memberName.trim() || !memberEmail.trim()) {
      Alert.alert("Details required", "Enter the family member's name and email address.");
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.inviteFamilyMember(activeParent.family_id, {
        email: memberEmail.trim(),
        full_name: memberName.trim(),
        phone_number: memberPhone.trim() || undefined,
        relationship: memberRelation,
        role: memberRole,
        can_manage_medicines: canMeds,
        can_manage_appointments: canAppts,
        can_upload_documents: canDocs,
        can_share_doctor_brief: canBrief,
        can_view_location_history: canLoc,
      });
      await refreshData();
      setMemberName("");
      setMemberEmail("");
      setMemberPhone("");
      setInviteModalVisible(false);
      Alert.alert("Invitation sent", `A secure account invitation was sent to ${memberEmail.trim()}.`);
    } catch (error) {
      Alert.alert("Invitation failed", error instanceof Error ? error.message : "Try again shortly.");
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return { label: isHindi ? "अति आवश्यक" : "Urgent", color: Colors.emergencyDark, bg: Colors.emergencyLight };
      case "high":
        return { label: isHindi ? "उच्च" : "High", color: Colors.warningDark, bg: Colors.warningLight };
      case "medium":
        return { label: isHindi ? "सामान्य" : "Medium", color: Colors.secondaryDark, bg: Colors.secondaryLight };
      default:
        return { label: isHindi ? "कम" : "Low", color: Colors.textMuted, bg: Colors.surfaceAlt };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Header with Back navigation */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityLabel="Back to Home"
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.title, seniorMode && styles.seniorTitle]}>
              {isHindi ? "पारिवारिक देखभाल एवं कार्य" : "Family Care & Tasks"}
            </Text>
            <Text style={styles.subtitle}>
              {isHindi
                ? `${activeParent.full_name} के लिए दूरस्थ देखभाल समन्वय`
                : `Remote Eldercare Coordination for ${activeParent.full_name}`}
            </Text>
          </View>
        </View>

        {/* Segmented Top Switcher (Tasks vs Members) */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "tasks" && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("tasks");
            }}
          >
            <CheckCircle2 size={16} color={activeTab === "tasks" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === "tasks" && styles.segmentTextActive]}>
              {isHindi ? `देखभाल कार्य (${tasks.length})` : `Care Tasks (${tasks.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "members" && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab("members");
            }}
          >
            <Users size={16} color={activeTab === "members" ? Colors.primaryDark : Colors.textMuted} />
            <Text style={[styles.segmentText, activeTab === "members" && styles.segmentTextActive]}>
              {isHindi ? `परिवार एवं केयरगिवर (${familyMembers.length})` : `Family & Team (${familyMembers.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "tasks" ? (
          <>
            {/* Task Action Bar */}
            <View style={styles.taskActionBar}>
              <View style={styles.filterPillsRow}>
                {(["all", "pending", "completed"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, taskFilter === f && styles.filterPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setTaskFilter(f);
                    }}
                  >
                    <Text style={[styles.filterPillText, taskFilter === f && styles.filterPillTextActive]}>
                      {f === "all" ? (isHindi ? "सभी" : "All") : f === "pending" ? (isHindi ? "लंबित" : "Pending") : (isHindi ? "पूर्ण" : "Completed")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addTaskBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setAddTaskModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addTaskBtnText}>{isHindi ? "नया कार्य" : "Add Task"}</Text>
              </TouchableOpacity>
            </View>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <CheckCircle2 size={40} color={Colors.primary} />
                <Text style={styles.emptyTitle}>
                  {isHindi ? "कोई कार्य लंबित नहीं है!" : "All caught up!"}
                </Text>
                <Text style={styles.emptySub}>
                  {isHindi ? "परिवार के सदस्यों को नई जिम्मेदारियां सौंपने के लिए '+ नया कार्य' दबाएं।" : "Tap '+ Add Task' to assign healthcare tasks to family or caregivers."}
                </Text>
              </View>
            ) : (
              filteredTasks.map((t) => {
                const isDone = t.status === "completed";
                const pBadge = getPriorityBadge(t.priority);

                return (
                  <View key={t.id} style={[styles.taskCard, isDone && styles.taskCardDone, Shadows.card]}>
                    <TouchableOpacity
                      style={styles.checkCircleBtn}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        toggleTaskCompleted(t.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                        {isDone && <Check size={14} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.taskMainInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
                          {t.title}
                        </Text>
                        <View style={[styles.priorityBadge, { backgroundColor: pBadge.bg }]}>
                          <Text style={[styles.priorityBadgeText, { color: pBadge.color }]}>{pBadge.label}</Text>
                        </View>
                      </View>

                      {t.description && (
                        <Text style={[styles.taskDesc, isDone && styles.taskDescDone]} numberOfLines={2}>
                          {t.description}
                        </Text>
                      )}

                      <View style={styles.taskMetaRow}>
                        <View style={styles.metaItem}>
                          <Calendar size={12} color={Colors.textMuted} />
                          <Text style={styles.metaText}>{t.due_date || "No due date"}</Text>
                        </View>

                        {t.assigned_to_name && (
                          <View style={styles.metaItem}>
                            <User size={12} color={Colors.primaryDark} />
                            <Text style={styles.metaText}>{t.assigned_to_name}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteTaskBtn}
                      onPress={() => setTaskToDelete(t)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            {/* Visual Hero Family Card */}
            <View style={[styles.familyHeroCard, Shadows.card]}>
              <Image
                source={require("../../assets/family_hero.jpg")}
                style={styles.familyHeroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.85)"]}
                style={styles.familyHeroOverlay}
              >
                <View style={styles.familyHeroPill}>
                  <Sparkles size={11} color="#FFFFFF" />
                  <Text style={styles.familyHeroPillText}>
                    {isHindi ? "सक्रिय पारिवारिक केयर सर्कल" : "Multi-City Circle Active"}
                  </Text>
                </View>
                <Text style={styles.familyHeroTitle}>
                  {isHindi ? "सदा जुड़े रहें, कभी भी कहीं भी" : "Connected Care Across Distance"}
                </Text>
                <Text style={styles.familyHeroDesc}>
                  {isHindi
                    ? "भाई-बहन, केयरगिवर एवं डॉक्टर मिलकर माता-पिता के स्वास्थ्य का ध्यान रख रहे हैं।"
                    : "Real-time coordination for daily medicines, vitals, and emergency visits."}
                </Text>
              </LinearGradient>
            </View>

            {/* Family Members & Caregiver Team Section */}
            <View style={styles.teamHeaderRow}>
              <View>
                <Text style={styles.teamTitle}>
                  {isHindi ? "देखभाल नेटवर्क" : "Authorized Care Circle"}
                </Text>
                <Text style={styles.teamSub}>
                  {isHindi
                    ? "विभिन्न स्तरों की अनुमतियों के साथ जुड़े हुए सदस्य"
                    : "Granular access controls for adult children, spouse, and caregivers"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setInviteModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={styles.inviteBtnText}>{isHindi ? "सदस्य जोड़ें" : "Invite"}</Text>
              </TouchableOpacity>
            </View>

            {familyMembers.map((member) => (
              <View key={member.id} style={[styles.memberCard, Shadows.card]}>
                <View style={styles.memberTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{member.avatar_initials}</Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          member.role === "family_member" && styles.roleFamily,
                          member.role === "caregiver" && styles.roleCaregiver,
                          member.role === "doctor" && styles.roleDoctor,
                        ]}
                      >
                        <Text style={styles.roleText}>{member.role.replace("_", " ").toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={styles.memberRelation}>{member.relationship}</Text>

                    <View style={styles.contactDetailsRow}>
                      <View style={styles.contactItem}>
                        <Mail size={12} color={Colors.textMuted} />
                        <Text style={styles.contactText}>{member.email}</Text>
                      </View>
                      {member.phone && (
                        <View style={styles.contactItem}>
                          <Phone size={12} color={Colors.textMuted} />
                          <Text style={styles.contactText}>{member.phone}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Granular Permissions Chips */}
                <View style={styles.permissionsDivider} />
                <Text style={styles.permsTitle}>{isHindi ? "सक्रिय अनुमतियाँ:" : "Active Permissions:"}</Text>
                <View style={styles.permsChipsRow}>
                  {member.can_manage_medicines && (
                    <View style={styles.permChip}>
                      <Check size={11} color={Colors.primaryDark} />
                      <Text style={styles.permChipText}>{isHindi ? "दवाइयां" : "Medicines"}</Text>
                    </View>
                  )}
                  {member.can_manage_appointments && (
                    <View style={styles.permChip}>
                      <Check size={11} color={Colors.primaryDark} />
                      <Text style={styles.permChipText}>{isHindi ? "परामर्श" : "Appointments"}</Text>
                    </View>
                  )}
                  {member.can_upload_documents && (
                    <View style={styles.permChip}>
                      <Check size={11} color={Colors.primaryDark} />
                      <Text style={styles.permChipText}>{isHindi ? "रिकॉर्ड्स" : "Documents"}</Text>
                    </View>
                  )}
                  {member.can_share_doctor_brief && (
                    <View style={styles.permChip}>
                      <Check size={11} color={Colors.primaryDark} />
                      <Text style={styles.permChipText}>{isHindi ? "डॉक्टर शेयर" : "Doctor Brief"}</Text>
                    </View>
                  )}
                  {member.can_view_location_history && (
                    <View style={styles.permChip}>
                      <Check size={11} color={Colors.primaryDark} />
                      <Text style={styles.permChipText}>{isHindi ? "स्थान इतिहास" : "Location Visits"}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <SwipeableBottomSheet
        visible={addTaskModalVisible}
        onClose={() => setAddTaskModalVisible(false)}
        maxHeight="90%"
        containerStyle={styles.modalCard}
      >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isHindi ? "नया देखभाल कार्य जोड़ें" : "Add Healthcare Task"}</Text>
              <TouchableOpacity onPress={() => setAddTaskModalVisible(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{isHindi ? "कार्य शीर्षक *" : "Task Title *"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={isHindi ? "उदा. अपोलो से दवाइयां लाना" : "e.g. Pick up Telmisartan from pharmacy"}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "विवरण (वैकल्पिक)" : "Notes / Instructions"}</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                placeholder={isHindi ? "आवश्यक विवरण या पर्चा निर्देश..." : "Additional details or instructions..."}
                value={taskDesc}
                onChangeText={setTaskDesc}
                multiline
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "प्राथमिकता" : "Priority"}</Text>
              <View style={styles.prioritySelectorRow}>
                {(["urgent", "high", "medium", "low"] as const).map((p) => {
                  const pConfig = getPriorityBadge(p);
                  const isSelected = taskPriority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.prioritySelectBtn,
                        isSelected && { backgroundColor: pConfig.color, borderColor: pConfig.color },
                      ]}
                      onPress={() => setTaskPriority(p)}
                    >
                      <Text style={[styles.prioritySelectText, isSelected && { color: "#FFFFFF", fontWeight: "700" }]}>
                        {pConfig.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>{isHindi ? "नियत समय" : "Due Date & Time"}</Text>
              <TextInput
                style={styles.textInput}
                value={taskDueDate}
                onChangeText={setTaskDueDate}
                placeholder="YYYY-MM-DDTHH:mm:ssZ (optional)"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "किसे सौंपा जाए" : "Assign To"}</Text>
              <View style={styles.assigneeList}>
                {familyMembers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.assigneeChip, taskAssignee === m.name && styles.assigneeChipActive]}
                    onPress={() => setTaskAssignee(m.name)}
                  >
                    <Text
                      style={[
                        styles.assigneeChipText,
                        taskAssignee === m.name && styles.assigneeChipTextActive,
                      ]}
                    >
                      {m.name} ({m.relationship.split(" ")[0]})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateTask}
                activeOpacity={0.8}
              >
                <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
                  <Text style={styles.submitText}>{isHindi ? "कार्य सहेजें" : "Save Care Task"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
      </SwipeableBottomSheet>

      {/* Invite Family Member Modal */}
      <SwipeableBottomSheet
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        maxHeight="90%"
        containerStyle={styles.modalCard}
      >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isHindi ? "परिवार / केयरगिवर को जोड़ें" : "Invite Care Collaborator"}</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{isHindi ? "पूरा नाम *" : "Full Name *"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Family member's full name"
                value={memberName}
                onChangeText={setMemberName}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "ईमेल आईडी *" : "Email Address *"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. rohit@example.com"
                value={memberEmail}
                onChangeText={setMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "फ़ोन नंबर" : "Phone Number"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+91 98123 45678"
                value={memberPhone}
                onChangeText={setMemberPhone}
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>{isHindi ? "भूमिका व रिश्ता" : "Role & Relationship"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Son, Daughter, Local Caregiver, Nurse"
                value={memberRelation}
                onChangeText={setMemberRelation}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>{isHindi ? "स्वीकृत अनुमतियाँ:" : "Granted Permissions:"}</Text>

              <TouchableOpacity style={styles.permCheckboxRow} onPress={() => setCanMeds(!canMeds)}>
                <View style={[styles.permBox, canMeds && styles.permBoxChecked]}>
                  {canMeds && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.permBoxLabel}>{isHindi ? "दवाइयां प्रबंधित करें" : "Manage Medicines & Schedules"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permCheckboxRow} onPress={() => setCanAppts(!canAppts)}>
                <View style={[styles.permBox, canAppts && styles.permBoxChecked]}>
                  {canAppts && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.permBoxLabel}>{isHindi ? "डॉक्टर परामर्श प्रबंधित करें" : "Manage Doctor Appointments"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permCheckboxRow} onPress={() => setCanDocs(!canDocs)}>
                <View style={[styles.permBox, canDocs && styles.permBoxChecked]}>
                  {canDocs && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.permBoxLabel}>{isHindi ? "मेडिकल रिकॉर्ड्स देखें व अपलोड करें" : "View & Upload Health Records"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permCheckboxRow} onPress={() => setCanBrief(!canBrief)}>
                <View style={[styles.permBox, canBrief && styles.permBoxChecked]}>
                  {canBrief && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.permBoxLabel}>{isHindi ? "डॉक्टर सारांश QR शेयर करें" : "Share Doctor Consultation Brief"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.permCheckboxRow} onPress={() => setCanLoc(!canLoc)}>
                <View style={[styles.permBox, canLoc && styles.permBoxChecked]}>
                  {canLoc && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.permBoxLabel}>{isHindi ? "अस्पताल/दुकान विज़िट इतिहास देखें" : "View Healthcare Location Visits"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleInviteMember}
                activeOpacity={0.8}
              >
                <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
                  <Text style={styles.submitText}>{isHindi ? "आमंत्रण भेजें" : "Send Access Invitation"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
      </SwipeableBottomSheet>

      {/* Delete Task Confirmation Modal */}
      <ConfirmationModal
        visible={!!taskToDelete}
        title={isHindi ? "कार्य हटाएं?" : "Delete Care Task?"}
        message={
          isHindi
            ? `क्या आप '${taskToDelete?.title}' कार्य को हटाना चाहते हैं?`
            : `Are you sure you want to remove '${taskToDelete?.title}'? Family members will be notified.`
        }
        confirmText={isHindi ? "हटाएं" : "Delete"}
        cancelText={isHindi ? "रद्द करें" : "Cancel"}
        isDestructive={true}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
        onCancel={() => setTaskToDelete(null)}
      />
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
  headerTitleRow: {
    marginBottom: Spacing.sm,
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
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  seniorTitle: {
    fontSize: Typography.seniorSizes.lg,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
  taskActionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  filterPillsRow: {
    flexDirection: "row",
    gap: 6,
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
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  addTaskBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  taskCard: {
    ...Glass.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCardDone: {
    backgroundColor: "#F1F5F9",
    opacity: 0.75,
  },
  checkCircleBtn: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskMainInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  taskTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  taskDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  taskDescDone: {
    color: Colors.textMuted,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  deleteTaskBtn: {
    padding: 4,
    marginLeft: 6,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  teamHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  teamTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  teamSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  inviteBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  memberCard: {
    ...Glass.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDeep,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceAlt,
  },
  roleFamily: {
    backgroundColor: Colors.secondaryLight,
  },
  roleCaregiver: {
    backgroundColor: Colors.warningLight,
  },
  roleDoctor: {
    backgroundColor: Colors.indigoLight,
  },
  roleText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  memberRelation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  contactDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  permissionsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  permsTitle: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  permsChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  permChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primaryFaint,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  permChipText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.medium,
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
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prioritySelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  prioritySelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
  },
  prioritySelectText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  assigneeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  assigneeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assigneeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  assigneeChipText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
  },
  assigneeChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  permCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  permBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  permBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  permBoxLabel: {
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
  familyHeroCard: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  familyHeroImage: {
    width: "100%",
    height: "100%",
  },
  familyHeroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    justifyContent: "flex-end",
    padding: Spacing.md,
  },
  familyHeroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  familyHeroPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
  },
  familyHeroTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  familyHeroDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 16,
  },
});
