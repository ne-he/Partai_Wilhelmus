# Implementation Plan: Family App V4

## Overview

Implementasi fitur-fitur baru untuk family web app meliputi: page transitions dengan Framer Motion, drag-and-drop task management, Pomodoro timer dengan audio notification, dan daily task reset dengan queue management. Aplikasi menggunakan Next.js 14 App Router, TypeScript, Tailwind CSS, dan Supabase.

## Tasks

- [x] 1. Setup dependencies dan konfigurasi awal
  - Install dependencies: framer-motion, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, fast-check
  - Setup Vercel cron configuration (vercel.json)
  - Add environment variables untuk CRON_SECRET
  - _Requirements: 1.4, 2.1, 5.11_

- [x] 2. Database migrations dan schema updates
  - [x] 2.1 Create focus_sessions table
    - Create table dengan kolom: id, user_id, task_id, start_time, end_time, duration, session_type, created_at
    - Add foreign key constraints dan indexes
    - Setup RLS policies untuk user access
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 2.2 Create task_queue table
    - Create table dengan kolom: id, user_id, title, status, original_created_at, queued_at, order
    - Add foreign key constraints dan indexes
    - Setup RLS policies untuk user access
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 2.3 Update personal_tasks table
    - Add order column (INTEGER DEFAULT 0)
    - Create indexes untuk user_id+status dan order
    - _Requirements: 2.7_

- [x] 3. Implement PageTransition component dengan Framer Motion
  - [x] 3.1 Create PageTransition wrapper component
    - Implement motion.div dengan variants (initial, animate, exit)
    - Configure animation duration 0.3s dengan cubic-bezier easing
    - Add AnimatePresence dengan mode="wait"
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 3.2 Write property test untuk PageTransition
    - **Property 1: Page Transition Animation Presence**
    - **Validates: Requirements 1.2, 1.5**
  
  - [x] 3.3 Integrate PageTransition ke app layout
    - Wrap page content dengan PageTransition component
    - Implement navigation lock during transition
    - _Requirements: 1.5, 1.6_
  
  - [ ]* 3.4 Write property test untuk navigation lock
    - **Property 2: Navigation Lock During Transition**
    - **Validates: Requirements 1.6**

- [x] 4. Checkpoint - Verify page transitions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement drag-and-drop untuk personal tasks
  - [x] 5.1 Create DraggableTask component
    - Implement useSortable hook dari @dnd-kit
    - Add visual feedback (opacity, cursor states)
    - Handle drag attributes dan listeners
    - _Requirements: 2.1, 2.5, 10.2, 10.7, 10.8_
  
  - [x] 5.2 Create DroppableColumn component
    - Implement useDroppable hook untuk status columns
    - Add hover highlight untuk valid drop targets
    - Create three columns: Pending, In Progress, Done
    - _Requirements: 2.3, 10.3_
  
  - [x] 5.3 Implement DndContext di personal tasks page
    - Configure sensors (PointerSensor, KeyboardSensor)
    - Implement handleDragStart, handleDragEnd handlers
    - Add DragOverlay dengan ghost preview
    - _Requirements: 2.1, 10.1_
  
  - [x] 5.4 Implement status change logic
    - Detect column changes dan update task status
    - Persist changes ke Supabase personal_tasks table
    - Implement optimistic updates dengan rollback on error
    - _Requirements: 2.2, 2.6, 2.8_
  
  - [ ]* 5.5 Write property test untuk status change persistence
    - **Property 3: Drag-and-Drop Status Change Persistence**
    - **Validates: Requirements 2.2, 2.6**
  
  - [x] 5.6 Implement reordering logic dalam same column
    - Calculate new order based on drop position
    - Batch update orders ke database
    - Add smooth transition animations
    - _Requirements: 2.4, 2.6, 10.5_
  
  - [ ]* 5.7 Write property test untuk reordering
    - **Property 4: Drag-and-Drop Reordering**
    - **Validates: Requirements 2.4, 2.6**
  
  - [ ]* 5.8 Write unit tests untuk drag visual feedback
    - Test opacity changes during drag
    - Test cursor state changes
    - Test transition animations
    - _Requirements: 2.5, 10.2, 10.6_

- [x] 6. Checkpoint - Verify personal tasks drag-and-drop
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement drag-and-drop assignment untuk family tasks
  - [x] 7.1 Create DraggableMember component
    - Implement useDraggable hook untuk user chips
    - Add visual feedback during drag
    - Disable untuk child users
    - _Requirements: 3.1, 3.4_
  
  - [x] 7.2 Create DroppableFamilyTask component
    - Implement useDroppable hook untuk task cards
    - Add hover highlight untuk assignment drop
    - Show invalid drop indicator when needed
    - _Requirements: 3.5, 10.3, 10.4_
  
  - [x] 7.3 Implement assignment DndContext di family page
    - Setup drag handlers untuk member-to-task assignment
    - Implement handleDragEnd untuk assignment update
    - Add DragOverlay untuk member chips
    - _Requirements: 3.2_
  
  - [x] 7.4 Implement assignment update logic
    - Update assigned_to field di family_tasks table
    - Auto-update status ke "in_progress" on assignment
    - Handle reassignment (move from one task to another)
    - _Requirements: 3.2, 3.3, 3.6_
  
  - [ ]* 7.5 Write property test untuk assignment update
    - **Property 7: Family Task Assignment Update**
    - **Validates: Requirements 3.2**
  
  - [ ]* 7.6 Write property test untuk auto status change
    - **Property 8: Auto Status Change on Assignment**
    - **Validates: Requirements 3.3**
  
  - [x] 7.7 Implement role-based access control
    - Check user role (papa/mama vs child)
    - Disable drag functionality untuk child users
    - Maintain universal status change access
    - _Requirements: 3.4, 3.8_
  
  - [ ]* 7.8 Write property test untuk child user restriction
    - **Property 9: Child User Assignment Restriction**
    - **Validates: Requirements 3.4**

- [x] 8. Checkpoint - Verify family tasks assignment
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Pomodoro timer
  - [x] 9.1 Create usePomodoro custom hook
    - Implement timer state management (timeLeft, isRunning, sessionType)
    - Add localStorage persistence untuk timer state
    - Implement countdown logic dengan setInterval
    - Handle timer restoration on page load
    - _Requirements: 4.1, 4.5, 4.6, 4.12_
  
  - [x] 9.2 Implement session completion logic
    - Auto-transition dari work (25 min) ke break (5 min)
    - Save completed work sessions ke focus_sessions table
    - Handle task association (optional task_id)
    - _Requirements: 4.2, 4.3, 4.4, 4.9, 4.10_
  
  - [ ]* 9.3 Write property test untuk auto-transition
    - **Property 13: Work Session Auto-Transition to Break**
    - **Validates: Requirements 4.3**
  
  - [ ]* 9.4 Write property test untuk session persistence
    - **Property 18: Focus Session Persistence**
    - **Validates: Requirements 4.9**
  
  - [x] 9.3 Create PomodoroTimer UI component
    - Display countdown timer (MM:SS format)
    - Add control buttons (start, pause, reset, skip to break)
    - Show current session type (work/break)
    - Add task selector dropdown
    - _Requirements: 4.1, 4.8_
  
  - [x] 9.4 Create TimerProgressRing component
    - Implement SVG circular progress indicator
    - Add Framer Motion animations untuk progress
    - Show pulse animation saat timer running
    - _Requirements: 4.6_
  
  - [ ]* 9.5 Write property test untuk timer background persistence
    - **Property 19: Timer Background Persistence**
    - **Validates: Requirements 4.12**
  
  - [ ]* 9.6 Write unit tests untuk timer controls
    - Test start, pause, reset, skip functionality
    - Test task association
    - Test state transitions
    - _Requirements: 4.8_

- [x] 10. Implement audio notification system
  - [x] 10.1 Create audio utility functions
    - Implement initializeAudio dengan Web Audio API
    - Load notification sound file
    - Handle AudioContext state (suspended/running)
    - _Requirements: 9.1, 9.3_
  
  - [x] 10.2 Implement playNotificationSound function
    - Play audio on timer completion
    - Request browser permission if needed
    - Implement fallback ke visual notification
    - Add browser Notification API support
    - _Requirements: 4.7, 9.2, 9.4, 9.5, 9.6_
  
  - [ ]* 10.3 Write property test untuk audio notification
    - **Property 17: Timer Completion Audio Notification**
    - **Validates: Requirements 4.7, 9.2**
  
  - [x] 10.3 Add notification sound file
    - Add audio file ke public/sounds/ directory
    - Ensure file size < 100KB untuk fast loading
    - _Requirements: 9.1, 9.4_
  
  - [x] 10.4 Implement mute/unmute toggle
    - Add mute state ke timer settings
    - Persist mute preference ke localStorage
    - Show mute icon indicator
    - _Requirements: 9.7_

- [x] 11. Checkpoint - Verify Pomodoro timer functionality
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Implement daily reset cron job
  - [x] 12.1 Create daily-reset API route
    - Create app/api/cron/daily-reset/route.ts
    - Implement GET handler dengan cron secret verification
    - Setup Supabase service role client
    - _Requirements: 5.1, 5.11_
  
  - [x] 12.2 Implement performUserReset function
    - Delete done tasks dari personal_tasks
    - Fetch pending/in_progress tasks
    - Insert tasks ke task_queue dengan preserved data
    - Delete moved tasks dari personal_tasks
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 12.3 Write property test untuk done task deletion
    - **Property 20: Daily Reset Done Task Deletion**
    - **Validates: Requirements 5.2**
  
  - [ ]* 12.4 Write property test untuk incomplete task queueing
    - **Property 21: Daily Reset Incomplete Task Queueing**
    - **Validates: Requirements 5.3, 5.4**
  
  - [x] 12.3 Implement multi-user processing
    - Fetch all users dari database
    - Process each user dengan error isolation
    - Return summary dengan success/error counts
    - _Requirements: 5.12, 5.13_
  
  - [x] 12.4 Add error handling dan retry logic
    - Implement transaction-like rollback on failure
    - Add retry dengan exponential backoff
    - Log errors tanpa blocking other users
    - _Requirements: 5.13_
  
  - [ ]* 12.5 Write integration test untuk cron execution
    - Test complete daily reset flow
    - Test error handling dan rollback
    - Test multi-user processing
    - _Requirements: 5.1, 5.12, 5.13_

- [x] 13. Implement queue management UI
  - [x] 13.1 Create TaskQueue component
    - Display queued tasks dari task_queue table
    - Show queued_at timestamp untuk each task
    - Add "Move to Today" button untuk each task
    - _Requirements: 5.5, 5.7, 5.9_
  
  - [x] 13.2 Implement moveQueueToToday function
    - Insert task ke personal_tasks table
    - Delete task dari task_queue table
    - Implement transaction-like pattern dengan rollback
    - _Requirements: 5.10_
  
  - [ ]* 13.3 Write property test untuk queue to today transfer
    - **Property 24: Queue to Today Drag Transfer**
    - **Validates: Requirements 5.8**
  
  - [x] 13.3 Integrate queue dengan drag-and-drop
    - Allow dragging tasks dari Queue ke Today column
    - Handle drop event untuk queue tasks
    - Update both tables on successful drop
    - _Requirements: 5.8_
  
  - [x] 13.4 Add queue display ke personal tasks page
    - Create two-column layout (Today's Tasks | Queue)
    - Fetch dan display queued tasks
    - Setup realtime subscription untuk queue changes
    - _Requirements: 5.5, 5.6, 5.7_
  
  - [ ]* 13.5 Write property test untuk queue status preservation
    - **Property 29: Task Queue Status Preservation**
    - **Validates: Requirements 7.3**
  
  - [ ]* 13.6 Write property test untuk timestamp preservation
    - **Property 30: Task Queue Original Timestamp Preservation**
    - **Validates: Requirements 7.4**

- [x] 14. Checkpoint - Verify queue management
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Apply theme consistency dan styling
  - [x] 15.1 Update CSS variables untuk earthtone theme
    - Define --bg-main, --bg-card, --text-main, --accent, --border
    - Use colors: #2C1A0E, #3E2C1B (bg), #F5E6D3 (text), #C9A53B (accent)
    - _Requirements: 8.1, 8.2, 8.3, 8.10_
  
  - [x] 15.2 Style all new components
    - Apply Playfair Display untuk headings
    - Apply Inter untuk body text
    - Add border-radius 10-12px untuk cards
    - Use 1px solid gold borders dengan opacity
    - _Requirements: 8.4, 8.5, 8.6, 8.8_
  
  - [x] 15.3 Add icons dan visual elements
    - Use Heroicons atau Lucide untuk icons
    - Apply gold color (#C9A53B) ke icons
    - _Requirements: 8.7_
  
  - [x] 15.4 Implement hover transitions
    - Add subtle transitions ke interactive elements
    - Use CSS transitions untuk smooth effects
    - _Requirements: 8.9_
  
  - [ ]* 15.5 Write property test untuk hover transitions
    - **Property 32: Interactive Element Hover Transition**
    - **Validates: Requirements 8.9**

- [x] 16. Error handling dan edge cases
  - [x] 16.1 Implement drag-and-drop error handling
    - Add optimistic updates dengan rollback
    - Show toast notifications on errors
    - Log errors untuk debugging
    - _Requirements: 2.8_
  
  - [x] 16.2 Implement timer error handling
    - Handle failed session saves dengan localStorage backup
    - Implement retry logic untuk failed sessions
    - Show non-intrusive warnings
    - _Requirements: 4.9_
  
  - [x] 16.3 Implement network error handling
    - Add retry wrapper dengan exponential backoff
    - Handle Supabase connection failures
    - Show loading states during retries
    - _Requirements: General reliability_
  
  - [x] 16.4 Implement auth error handling
    - Handle session expiration
    - Auto-redirect ke login on auth errors
    - Clear local state on sign out
    - _Requirements: General security_

- [x] 17. Integration dan final wiring
  - [x] 17.1 Wire Pomodoro timer ke personal tasks page
    - Integrate PomodoroTimer component
    - Connect timer dengan task list
    - Setup focus session statistics display
    - _Requirements: 4.1, 4.11_
  
  - [x] 17.2 Setup Supabase realtime subscriptions
    - Subscribe ke personal_tasks changes
    - Subscribe ke task_queue changes
    - Subscribe ke family_tasks changes
    - _Requirements: General real-time updates_
  
  - [x] 17.3 Configure Vercel cron deployment
    - Add vercel.json dengan cron schedule
    - Set environment variables di Vercel dashboard
    - Test cron endpoint dengan authorization
    - _Requirements: 5.11_
  
  - [ ]* 17.4 Write integration tests untuk complete workflows
    - Test personal tasks drag-and-drop flow
    - Test family assignment flow
    - Test Pomodoro timer flow
    - Test queue management flow
    - _Requirements: All requirements_

- [x] 18. Final checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks dan dapat di-skip untuk faster MVP
- Each task references specific requirements untuk traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples dan edge cases
- Implementation menggunakan TypeScript dengan Next.js 14 App Router
- Database operations menggunakan Supabase client dengan RLS policies
- Animations menggunakan Framer Motion untuk smooth transitions
- Drag-and-drop menggunakan @dnd-kit untuk accessibility support
