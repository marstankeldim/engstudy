import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the authenticated Clerk user id, or null if signed out.
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Ensures a User row exists for the current Clerk user and returns its id.
 * Acts as a fallback for local dev where the Clerk webhook may not be wired up.
 * Throws if the request is unauthenticated.
 */
export async function ensureUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return userId;

  const user = await currentUser();
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      name:
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null,
      imageUrl: user?.imageUrl ?? null,
    },
    update: {},
  });

  return userId;
}
