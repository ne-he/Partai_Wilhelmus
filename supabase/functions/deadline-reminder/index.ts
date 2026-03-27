// Supabase Edge Function: deadline-reminder
// Dipanggil setiap pagi untuk mengirim reminder H-1 deadline

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey!);

  const now = Date.now();
  const windowStart = new Date(now + 20 * 3600 * 1000).toISOString();
  const windowEnd = new Date(now + 28 * 3600 * 1000).toISOString();

  // Query tasks dengan deadline H-1 yang belum done
  const { data: tasks, error } = await supabase
    .from('family_tasks')
    .select('id, title, assigned_to, deadline')
    .neq('status', 'done')
    .not('deadline', 'is', null)
    .gte('deadline', windowStart)
    .lte('deadline', windowEnd);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!tasks || tasks.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ambil semua BOSS/CONSIGLIERE
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['papa', 'mama']);

  const adminIds = (admins ?? []).map((u: { id: string }) => u.id);
  const edgeFunctionUrl = Deno.env.get('SUPABASE_URL')! + '/functions/v1/send-push-notification';

  let totalSent = 0;

  for (const task of tasks) {
    const recipients = new Set<string>(adminIds);
    if (task.assigned_to) recipients.add(task.assigned_to);

    for (const userId of recipients) {
      try {
        await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title: 'Deadline Besok',
            body: task.title,
            data: { task_id: task.id, url: '/family' },
          }),
        });
        totalSent++;
      } catch {
        // ignore individual failures
      }
    }
  }

  return new Response(JSON.stringify({ processed: tasks.length, sent: totalSent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
