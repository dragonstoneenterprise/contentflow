import { createServerSupabase } from "@/lib/supabase/server";

export interface UsageResult {
  allowed: boolean;
  remaining: number;
  plan: string;
  error?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 999999, // effectively unlimited
};

export async function checkAndIncrementUsage(): Promise<UsageResult> {
  const supabase = await createServerSupabase();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { allowed: false, remaining: 0, plan: "none", error: "Not authenticated" };
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Create profile if missing (edge case)
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      plan: "free",
      daily_usage: 0,
      total_usage: 0,
      last_reset: new Date().toISOString().split("T")[0],
    });
    return { allowed: true, remaining: 2, plan: "free" };
  }

  const today = new Date().toISOString().split("T")[0];
  let currentUsage = profile.daily_usage;

  // Reset daily counter if it's a new day
  if (profile.last_reset !== today) {
    currentUsage = 0;
    await supabase
      .from("profiles")
      .update({ daily_usage: 0, last_reset: today })
      .eq("id", user.id);
  }

  const limit = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free;
  const remaining = Math.max(0, limit - currentUsage);

  if (currentUsage >= limit) {
    return {
      allowed: false,
      remaining: 0,
      plan: profile.plan,
      error: "Daily limit reached. Upgrade to Pro for unlimited.",
    };
  }

  // Increment usage
  await supabase
    .from("profiles")
    .update({
      daily_usage: currentUsage + 1,
      total_usage: (profile.total_usage || 0) + 1,
    })
    .eq("id", user.id);

  return {
    allowed: true,
    remaining: remaining - 1,
    plan: profile.plan,
  };
}
