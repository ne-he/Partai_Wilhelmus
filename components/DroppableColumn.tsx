'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableTask from './DraggableTask';

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

interface DroppableColumnProps {
  status: 'pending' | 'in_progress' | 'done';
  tasks: PersonalTask[];
  title: string;
  onDelete?: (taskId: string) => void;
}

const statusColors = {
  pending: 'border-yellow-500/30',
  in_progress: 'border-blue-500/30',
  done: 'border-green-500/30'
};

export default function DroppableColumn({ status, tasks, title, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: {
      type: 'column',
      status
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] bg-[var(--bg-card)] border-2 rounded-xl p-4 transition-all duration-200 ${
        isOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : statusColors[status]
      }`}
    >
      <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 font-serif">
        {title}
      </h3>
      
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]">
          {tasks.length === 0 ? (
            <p className="text-[var(--text-main)]/50 text-sm text-center py-8">
              No tasks
            </p>
          ) : (
            tasks.map(task => (
              <DraggableTask 
                key={task.id} 
                task={task}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
