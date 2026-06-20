import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CourseForm } from "@/components/courses/course-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "New Course" };

export default function NewCoursePage() {
  return (
    <div>
      <Header title="Create a Course" />
      <div className="mx-auto max-w-2xl p-6">
        <Link
          href="/courses"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <Card>
          <CardContent className="pt-6">
            <CourseForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
