import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    const startTime = Date.now();

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');

    if (usersError) throw usersError;

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users || []) {
      try {
        const result = await performUserReset(supabase, user.id);
        results.push({
          userId: user.id,
          username: user.username,
          ...result,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Reset failed for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          username: user.username,
          success: false,
          error: String(error),
        });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalUsers: users?.length || 0,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error('Daily reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Reset failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

async function performUserReset(supabase: any, userId: string) {
  // Step 1: Delete done tasks
  const { error: deleteError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'done');

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Step 2: Get pending/in_progress tasks
  const { data: tasksToQueue, error: fetchError } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('order', { ascending: true });

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // If no tasks to queue, we're done
  if (!tasksToQueue || tasksToQueue.length === 0) {
    return {
      success: true,
      deletedDone: true,
      queued: 0,
    };
  }

  // Step 3: Insert into task_queue
  const queueData = tasksToQueue.map((task: any, index: number) => ({
    user_id: task.user_id,
    title: task.title,
    status: task.status,
    original_created_at: task.created_at,
    order: index,
  }));

  const { error: insertError } = await supabase.from('task_queue').insert(queueData);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Step 4: Delete from personal_tasks
  const { error: deleteTasksError } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress']);

  if (deleteTasksError) {
    // Rollback: delete from queue
    await supabase
      .from('task_queue')
      .delete()
      .eq('user_id', userId)
      .in(
        'title',
        tasksToQueue.map((t: any) => t.title)
      );

    return { success: false, error: deleteTasksError.message };
  }

  return {
    success: true,
    deletedDone: true,
    queued: tasksToQueue.length,
  };
}
