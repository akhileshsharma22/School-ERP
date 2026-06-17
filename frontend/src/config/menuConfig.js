import {
  Database,
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  CalendarDays,
  IndianRupee,
  BookOpen,
  ClipboardList,
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },

  {
    title: "Master Setup",
    icon: Database,
    children: [
      {
        title: "Academic Years",
        path: "/master-setup/academic-years",
      },
      {
        title: "Classes & Sections",
        path: "/master-setup/classes-sections",
      },
      {
        title: "Streams",
        path: "/master-setup/streams",
      },
      {
        title: "Subjects",
        path: "/master-setup/subjects",
      },
      {
        title: "Departments",
        path: "/master-setup/departments",
      },
      {
        title: "Designations",
        path: "/master-setup/designations",
      },
      {
        title: "Categories",
        path: "/master-setup/categories",
      },
      {
        title: "Exam Types",
        path: "/master-setup/exam-types",
      },
    ],
  },

  {
    title: "Admissions",
    icon: UserPlus,
    children: [
      {
        title: "Enquiries",
        path: "/admissions/enquiries",
      },
      {
        title: "New Admission",
        path: "/admissions/new",
      },
      {
        title: "Admission List",
        path: "/admissions/list",
      },
      {
        title: "Document Verification",
        path: "/admissions/verification",
      },
      {
        title: "Admission Reports",
        path: "/admissions/reports",
      },
    ],
  },

  {
    title: "Students",
    icon: Users,
    children: [
      {
        title: "All Students",
        path: "/students",
      },
      {
        title: "Promotion",
        path: "/students/promotion",
      },
    ],
  },

  {
    title: "Staff",
    icon: GraduationCap,
    children: [
      {
        title: "All Staff",
        path: "/staff",
      },
      {
        title: "Leave Management",
        path: "/staff/leave",
      },
      {
        title: "Payroll",
        path: "/staff/payroll",
      },
    ],
  },

  {
    title: "Attendance",
    icon: CalendarDays,
    children: [
      {
        title: "Daily Attendance",
        path: "/attendance/dashboard",
      },
      {
        title: "Student Attendance",
        path: "/attendance/students",
      },
      {
        title: "Staff Attendance",
        path: "/attendance/staff",
      },
      {
        title: "Attendance Reports",
        path: "/attendance/reports",
      },
      {
        title: "Attendance Analytics",
        path: "/attendance/analytics",
      },
    ],
  },

  {
    title: "Academics",
    icon: BookOpen,
    children: [
      {
        title: "Classes",
        path: "/academics/classes",
      },
      {
        title: "Subjects",
        path: "/academics/subjects",
      },
      {
        title: "Timetable",
        path: "/academics/timetable",
      },
    ],
  },

  {
    title: "Examinations",
    icon: ClipboardList,
    children: [
      {
        title: "Exam Setup",
        path: "/exams/setup",
      },
      {
        title: "Exam Schedule",
        path: "/examinations/schedule",
      },
      {
        title: "Marks Entry",
        path: "/examinations/marks",
      },
      {
        title: "Results",
        path: "/examinations/results",
      },
      {
        title: "Report Cards",
        path: "/examinations/report-cards",
      },
      {
        title: "Exam Analytics",
        path: "/examinations/analytics",
      },
      {
        title: "Grade Config",
        path: "/examinations/grade-config",
      },
    ],
  },

  {
    title: "Fees & Finance",
    icon: IndianRupee,
    children: [
      {
        title: "Fee Structure",
        path: "/fees/structure",
      },
      {
        title: "Collect Fees",
        path: "/fees/collect",
      },
      {
        title: "Fee Reports",
        path: "/fees/reports",
      },
    ],
  },
];
