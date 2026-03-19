'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

interface DraggableTaskProps {
  task: PersonalTask;
  onDelete?: (taskId: string) => void;
}

export default function DraggableTask({ task, onDelete }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-3 hover:border-[var(--accent)] transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-main)] flex-1">{task.title}</p>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="ml-2 text-red-400 hover:text-red-300 transition-colors"
            aria-label="Delete task"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
