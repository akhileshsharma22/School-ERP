import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  CalendarDays,
  IndianRupee,
  BookOpen,
  ClipboardList,
  Bus,
  Library,
  FileBarChart,
  Settings,
  MessageSquare,
  Building2,
  Wallet,
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
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
        title: "Visitors",
        path: "/admissions/visitors",
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
      {
        title: "Student ID Cards",
        path: "/students/id-cards",
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
        title: "Departments",
        path: "/staff/departments",
      },
      {
        title: "Leave Management",
        path: "/staff/leave",
      },
    ],
  },

  {
    title: "Attendance",
    icon: CalendarDays,
    children: [
      {
        title: "Student Attendance",
        path: "/attendance/students",
      },
      {
        title: "Staff Attendance",
        path: "/attendance/staff",
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
    path: "/examinations",
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

  {
    title: "Accounts",
    icon: Wallet,
    path: "/accounts",
  },

  {
    title: "Transport",
    icon: Bus,
    path: "/transport",
  },

  {
    title: "Library",
    icon: Library,
    path: "/library",
  },

  {
    title: "Communication",
    icon: MessageSquare,
    path: "/communication",
  },

  {
    title: "Reports",
    icon: FileBarChart,
    path: "/reports",
  },

  {
    title: "School Settings",
    icon: Building2,
    path: "/school-settings",
  },

  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];