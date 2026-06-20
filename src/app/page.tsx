import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Course Materials",
    description:
      "Drop in PDFs — lecture slides, textbooks, lab reports. Our AI reads everything.",
  },
  {
    icon: Brain,
    title: "AI Quiz Generation",
    description:
      "Get multiple choice, true/false, and short answer questions generated instantly from your content.",
  },
  {
    icon: Zap,
    title: "Smart Flashcards",
    description:
      "Automatically extract key concepts, formulas, and definitions with spaced repetition built in.",
  },
  {
    icon: FileText,
    title: "Study Guides",
    description:
      "Generate summaries, formula sheets, and exam review sheets tailored to your material.",
  },
  {
    icon: FlaskConical,
    title: "Practice Exams",
    description:
      "Timed, scored practice exams that mirror your actual coursework at custom difficulty levels.",
  },
  {
    icon: Sparkles,
    title: "AI Tutor",
    description:
      "Ask anything about your uploaded materials. Get explanations, examples, and guided walkthroughs.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Track scores, study streaks, and weak areas. Get personalized recommendations.",
  },
  {
    icon: BookOpen,
    title: "Organized by Course",
    description:
      "Keep everything organized by course. All your study tools in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">⚡</span>
            <span>EngStudy</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Show when="signed-out">
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonVariants()}>
                Get started free
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={buttonVariants()}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-powered study tools
          </Badge>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Study smarter,{" "}
            <span className="text-primary">not harder</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
            Upload your engineering course materials and instantly get quizzes, flashcards,
            study guides, and a personal AI tutor — all grounded in your own content.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Show when="signed-out">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                Start studying for free
              </Link>
              <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Go to Dashboard
              </Link>
            </Show>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold">Everything you need to ace your exams</h2>
              <p className="text-muted-foreground">
                From lecture slides to full practice exams — all from your own materials.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to study smarter?</h2>
            <p className="mb-8 text-muted-foreground">
              Join students who are spending less time stressing and more time understanding.
            </p>
            <Show when="signed-out">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                Create your free account
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Go to Dashboard
              </Link>
            </Show>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} EngStudy. Built for engineering students.</p>
      </footer>
    </div>
  );
}
