"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "My Courses", icon: GraduationCap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-sidebar-primary">⚡</span>
          <span className="text-sidebar-foreground">EngStudy</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="mt-4">
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Study Tools
          </p>
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Select a course to access tools.
          </p>
        </div>
      </nav>

      {/* User */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-sidebar-foreground">Account</span>
        </div>
      </div>
    </aside>
  );
}

interface CourseSidebarProps {
  courseId: string;
  courseName: string;
  emoji: string;
}

export function CourseSidebar({ courseId, courseName, emoji }: CourseSidebarProps) {
  const pathname = usePathname();
  const base = `/courses/${courseId}`;

  const items = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/documents`, label: "Documents", icon: FileText },
    { href: `${base}/quizzes`, label: "Quizzes", icon: Brain },
    { href: `${base}/flashcards`, label: "Flashcards", icon: Zap },
    { href: `${base}/study-guide`, label: "Study Guides", icon: BookOpen },
    { href: `${base}/practice-exam`, label: "Practice Exams", icon: FlaskConical },
    { href: `${base}/tutor`, label: "AI Tutor", icon: MessageSquare },
  ];

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="border-b p-4">
        <Link
          href="/courses"
          className="mb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          ← All courses
        </Link>
        <p className="text-lg">{emoji}</p>
        <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">{courseName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
