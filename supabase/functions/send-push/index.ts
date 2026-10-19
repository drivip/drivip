import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PushPayload {
  tenant_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceKey;
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@drivip.app";

  if (!supabaseUrl || !serviceKey) return json({ error: "supabase_not_configured" }, 500);
  if (!vapidPublic || !vapidPrivate) return json({ error: "vapid_not_configured" }, 500);

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "missing_authorization" }, 401);

  const userClient = createClient(supabaseUrl, anonKey as string, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
  const caller = userData.user;

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!payload?.title || !payload?.body) return json({ error: "title_and_body_required" }, 400);
  if (!payload.tenant_id && !(payload.user_ids && payload.user_ids.length)) {
    return json({ error: "target_required" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: isSuper } = await userClient.rpc("is_superadmin");
  let allowed = isSuper === true;
  if (!allowed && payload.tenant_id) {
    const callerTenant = (caller.app_metadata as Record<string, unknown> | undefined)?.tenant_id;
    allowed = Boolean(callerTenant) && callerTenant === payload.tenant_id;
  }
  if (!allowed) return json({ error: "forbidden" }, 403);

  let query = admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (payload.tenant_id) query = query.eq("tenant_id", payload.tenant_id);
  if (payload.user_ids && payload.user_ids.length) query = query.in("user_id", payload.user_ids);

  const { data: subs, error: subsError } = await query;
  if (subsError) return json({ error: "fetch_failed", detail: subsError.message }, 500);
  if (!subs || subs.length === 0) {
    return json({ ok: true, total: 0, sent: 0, failed: 0, removed: 0 });
  }

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag,
    data: payload.data ?? {},
  });

  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          stale.push(sub.id);
        } else {
          failed += 1;
          console.error("push failed", status, (err as Error).message);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", stale);
  }

  return json({ ok: true, total: subs.length, sent, failed, removed: stale.length });
});
