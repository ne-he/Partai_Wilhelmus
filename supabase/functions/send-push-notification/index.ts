// Supabase Edge Function: send-push-notification
// Menerima payload { user_id, title, body, data? } dan mengirim push ke semua endpoint user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  // Validasi method
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validasi Authorization
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!payload.user_id || !payload.title || !payload.body) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Setup VAPID
  const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@partaiwilhelmus.app';

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  // Init Supabase client dengan service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey!);

  // Query push subscriptions untuk user ini
  const { data: subscriptions, error: queryError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys')
    .eq('user_id', payload.user_id);

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          notificationPayload
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // HTTP 410 Gone = endpoint tidak valid, hapus dari DB
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410) {
          invalidEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // Hapus endpoint yang tidak valid
  if (invalidEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', invalidEndpoints);
  }

  const status = sent === 0 && failed > 0 ? 500 : 200;
  return new Response(JSON.stringify({ sent, failed }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
});
