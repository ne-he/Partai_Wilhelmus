# Design — Partai Wilhelmus App

Dokumen ini menggabungkan desain teknis dari tiga fitur utama:
1. **Home Clock V2** — Halaman Home dengan jam, greeting, particles, themes
2. **Family App V4** — DnD tasks, Pomodoro, daily reset, page transitions
3. **Bible Page (Daily Verse)** — Halaman `/summary` sebagai Daily Verse

---

## BAGIAN 1: HOME CLOCK V2

### Stack
- Next.js 15 App Router, JavaScript, Supabase, CSS Variables

### File Structure
```
app/home/page.js              ← halaman utama
components/AnalogClock.js     ← jam analog SVG
components/ParticleCanvas.js  ← canvas background
components/GreetingText.js    ← greeting personal
components/ThemePicker.js     ← theme selector
components/TaskSummary.js     ← ringkasan tugas
```

### Themes
| Tema    | --bg-main | --accent  | --text-main |
|---------|-----------|-----------|-------------|
| Vintage | #1a1612   | #c8a96e   | #f0e6d3     |
| Minimal | #0d0d0d   | #ffffff   | #e0e0e0     |
| Stellar | #050510   | #7090e0   | #c8d8f0     |

### AnalogClock
- SVG viewBox `0 0 200 200`
- 3 jarum: hour (tebal), minute (sedang), second (tipis/aksen)
- Rotasi: detik `s*6`, menit `m*6+s*0.1`, jam `h*30+m*0.5`
- `requestAnimationFrame` → fallback `setInterval(1000)` jika reducedMotion
- Drop shadow via SVG `<filter feDropShadow>`

### ParticleCanvas
- `position: fixed`, z-index 0, pointer-events none
- 80 partikel, repulsi radius 120px
- Resize handler update canvas dimensions
- Static jika reducedMotion

### GreetingText
- `GREETING_MAP`: email → nama panggilan
- `getTimePeriod(hour)`: Pagi/Siang/Malam/Tengah Malam
- `setInterval(60000)` untuk auto-update
- `aria-live="polite"` pada wrapper

### ThemePicker
- Props: `theme`, `onThemeChange`, `userId`
- Simpan ke `localStorage` key `home_theme_{userId}`
- `aria-pressed` per tombol

### TaskSummary
- Fetch `personal_tasks` by `user_id`
- Hitung total, done, remaining
- `onClick` → `router.push('/personal')`

---

## BAGIAN 2: FAMILY APP V4

### Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Framer Motion, @dnd-kit

### File Structure
```
app/personal/page.tsx              ← personal tasks + Pomodoro
app/family/page.tsx                ← family tasks + DnD assignment
app/api/cron/daily-reset/route.ts  ← cron handler
components/PageTransition.tsx      ← Framer Motion wrapper
components/DraggableTask.tsx       ← task card draggable
components/DroppableColumn.tsx     ← status column droppable
components/DraggableMember.tsx     ← member chip draggable
components/DroppableFamilyTask.tsx ← family task droppable
components/TaskQueue.tsx           ← queue display
vercel.json                        ← cron schedule
```

### PageTransition
```typescript
variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}
// duration: 0.3s, easing: [0.4, 0, 0.2, 1]
```

### DnD Personal Tasks
- `DndContext` + `SortableContext` dari @dnd-kit
- `PointerSensor` (activationConstraint: distance 8) + `KeyboardSensor`
- `handleDragEnd`: deteksi kolom baru → update status + order di Supabase
- Optimistic update + rollback on error
- `DragOverlay` untuk ghost preview

### DnD Family Assignment
- `DraggableMember`: `useDraggable`, disabled untuk Child_User
- `DroppableFamilyTask`: `useDroppable`, highlight saat hover
- `handleDragEnd`: update `assigned_to` + auto-set status `in_progress`

### Pomodoro Timer
```typescript
interface TimerState {
  timeLeft: number;      // seconds
  isRunning: boolean;
  sessionType: 'work' | 'break';
  currentTaskId: string | null;
  startedAt: number | null;
}
// Work: 1500s, Break: 300s
// Persist ke localStorage key 'pomodoroState'
// Auto-transition work → break saat timeLeft = 0
// Save ke focus_sessions saat work session selesai
```

### Daily Reset Cron
```
GET /api/cron/daily-reset
Authorization: Bearer {CRON_SECRET}

Per user:
1. DELETE personal_tasks WHERE status = 'done'
2. SELECT personal_tasks WHERE status IN ('pending','in_progress')
3. INSERT task_queue (preserve title, status, original_created_at)
4. DELETE personal_tasks yang sudah dipindahkan
```

### Database Schema
```sql
-- focus_sessions
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES personal_tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  session_type VARCHAR(10) CHECK (session_type IN ('work','break')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- task_queue
CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  original_created_at TIMESTAMPTZ NOT NULL,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  order INTEGER NOT NULL DEFAULT 0
);

-- personal_tasks update
ALTER TABLE personal_tasks ADD COLUMN IF NOT EXISTS order INTEGER DEFAULT 0;
```

---

## BAGIAN 3: BIBLE PAGE (DAILY VERSE)

### Stack
- Next.js App Router, JavaScript, Supabase, react-icons

### File Structure
```
app/summary/page.js       ← halaman Daily Verse (diganti konten)
Lib/utils/bibleApi.ts     ← utility fetch + cache
```

### Data Flow
```
DailyVersePage (mount)
  → supabase.auth.getUser() → redirect /login jika tidak ada sesi
  → getDailyVerse()
      → cek localStorage key 'dailyVerseDate' vs today
          → HIT: return JSON.parse(localStorage['dailyVerse'])
          → MISS: fetchRandomVerse() → simpan → return
  → render VerseCard dengan fade-in
```

### bibleApi.ts
```typescript
interface Verse {
  reference: string;
  text: string;
  translationId: string;
}

// Cache keys
const STORAGE_KEY = 'dailyVerse';
const STORAGE_DATE_KEY = 'dailyVerseDate';

// getDailyVerse(): cek cache by date → fetch jika miss
// fetchRandomVerse(): GET https://bible-api.com/?random=1
```

### VerseCard Layout
```
┌──────────────────────────────────────────────┐
│ ❦                                          ❦ │  ← corner ornaments (opacity 0.15)
│                                              │
│  ✦ ─────────────────────────────────── ✦   │  ← ornamen atas
│                                              │
│  SABTU, 21 MARET 2026                        │  ← date label (gold, letter-spacing 3px)
│  📖 AYAT RENUNGAN HARIAN                     │  ← section label
│                                              │
│  "  [teks ayat italic Playfair Display]  "  │  ← tanda kutip besar opacity 0.12
│                                              │
│              ✦ ◆ ✦                          │  ← ornamen pemisah
│                          — Referensi         │  ← gold, italic
│  [KJV]                                       │  ← badge monospace
│                                              │
│  [Copy] [Share] [Refresh]                    │  ← action buttons
│                                              │
│  ✦ ─────────────────────────────────── ✦   │  ← ornamen bawah
│ ❦                                          ❦ │
└──────────────────────────────────────────────┘
```

### Glassmorphism Styles
```javascript
{
  background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(36,32,24,0.6), rgba(0,0,0,0.4))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(212,175,55,0.2)',
  borderRadius: '20px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
}
```

### Action Buttons
- **Copy**: `navigator.clipboard.writeText(text + ref + translation)` → toast
- **Share**: `navigator.share()` → fallback ke copy
- **Refresh**: `fetchRandomVerse()` langsung, **tidak** simpan ke cache harian

### Animasi
```javascript
// Fade-in
opacity: visible ? 1 : 0
transform: visible ? 'translateY(0)' : 'translateY(16px)'
transition: 'opacity 0.7s ease, transform 0.7s ease'

// Skip jika prefers-reduced-motion
```

### Footer
```
"Keluarga adalah Kekuatan, Iman adalah Senjata"
border-top: 1px solid rgba(212,175,55,0.15)
```
