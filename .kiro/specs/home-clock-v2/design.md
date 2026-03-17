# Design Document — home-clock-v2

## Overview

Fitur ini menambahkan halaman `/home` sebagai landing page utama setelah login pada aplikasi "Partai Wilhelmus". Halaman ini berfungsi sebagai personal dashboard yang menggabungkan jam analog SVG photorealistic, sistem partikel Canvas interaktif, greeting personal berbasis akun dan waktu, theme picker tiga tema, dan ringkasan tugas dari Supabase.

Halaman dibangun di atas Next.js 15 App Router dengan JavaScript murni (bukan TypeScript), menggunakan Supabase untuk auth dan data, CSS custom properties untuk theming, dan Web API native (SVG + Canvas + requestAnimationFrame) tanpa library animasi eksternal.

Setelah implementasi, alur pengguna berubah dari: Login → `/personal` menjadi: Login → `/home`.

---

## Architecture

```
app/
  home/
    page.js              <- halaman utama, orchestrator state
components/
  AnalogClock.js         <- SVG clock, rAF loop
  ParticleCanvas.js      <- Canvas particle system, mouse repulsion
  ThemePicker.js         <- 3 tema, localStorage persistence
  TaskSummary.js         <- Supabase query, task counts
  GreetingText.js        <- greeting engine, time period detection
  Sidebar.js             <- diperbarui: tambah item Home
```

### Data Flow

```
mount -> supabase.auth.getUser()
  no session -> router.push("/login")
  session OK -> setUser(user)
    -> fetch users table -> setProfile(profile)
    -> fetch personal_tasks WHERE user_id = user.id -> setTasks(tasks)
    -> read localStorage(home_theme_{userId}) -> setTheme(theme)
    -> render: ParticleCanvas + AnalogClock + GreetingText + TaskSummary + ThemePicker
```

### Theme Application Strategy

Theme diterapkan dengan mengganti CSS custom properties pada `:root` via JavaScript. Ini memungkinkan perubahan instan tanpa reload dan tanpa class switching.

```js
function applyTheme(themeName) {
  const vars = THEMES[themeName];
  Object.entries(vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}
```

---

## Components and Interfaces

### `app/home/page.js`

Orchestrator utama. Mengelola state global: `user`, `profile`, `tasks`, `theme`, `reducedMotion`.

```js
// State:
//   user: object | null        - Supabase auth user
//   profile: object | null     - row dari tabel users
//   tasks: array               - rows dari personal_tasks
//   theme: 'vintage'|'minimal'|'stellar'
//   reducedMotion: boolean
//   loading: boolean
```

Layout structure:

```
<div style="position:relative; min-height:100vh">
  <Sidebar user={profile} />
  <ParticleCanvas theme={theme} reducedMotion={reducedMotion} />  <- absolute bg, z-index:0
  <main style="margin-left:220px; position:relative; z-index:1">
    <AnalogClock reducedMotion={reducedMotion} theme={theme} />
    <GreetingText user={user} />
    <TaskSummary tasks={tasks} loading={taskLoading} error={taskError} />
    <ThemePicker theme={theme} userId={user?.id} onThemeChange={setTheme} />
    <ReducedMotionToggle ... />
    <div aria-live="polite" style="position:absolute;left:-9999px">{digitalTimeText}</div>
    <div aria-live="polite" style="position:absolute;left:-9999px">{greetingText}</div>
  </main>
</div>
```

### `components/AnalogClock.js`

SVG-based analog clock dengan smooth sweep second hand.

```js
// Props:
//   reducedMotion: boolean
//   theme: string
```

SVG structure (viewBox="0 0 200 200", center cx=100 cy=100, r=90):

- `<circle>` — face background
- `<circle>` — face border ring
- 60x `<line>` — minor ticks (r=85 to r=80)
- 12x `<line>` — major ticks (r=85 to r=72)
- 12x `<text>` — angka 1-12 di r=68
- `<line id="hour-hand">` — length 45, strokeWidth 4
- `<line id="minute-hand">` — length 60, strokeWidth 2.5
- `<line id="second-hand">` — length 70, strokeWidth 1.5
- `<circle r=4>` — center cap
- `<defs><filter id="shadow"/></defs>` — drop shadow filter

Kalkulasi rotasi jarum:

```js
// hour hand: 360 per 12 jam = 0.5 per menit = 0.00833 per detik
const hourDeg   = (h % 12) * 30 + m * 0.5 + s * (0.5 / 60);
// minute hand: 360 per 60 menit = 6 per menit = 0.1 per detik
const minuteDeg = m * 6 + s * 0.1;
// second hand: 360 per 60 detik = 6 per detik (smooth via ms)
const secondDeg = s * 6 + ms * 0.006;
```

Transform: SVG `transform="rotate(deg, 100, 100)"` pada setiap jarum.

rAF loop:

```js
useEffect(() => {
  if (reducedMotion) {
    const id = setInterval(updateHands, 1000);
    return () => clearInterval(id);
  }
  let rafId;
  function tick() { updateHands(); rafId = requestAnimationFrame(tick); }
  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}, [reducedMotion]);
```

### `components/ParticleCanvas.js`

Canvas-based particle system dengan mouse repulsion.

```js
// Props:
//   theme: string
//   reducedMotion: boolean
```

Particle object structure:

```js
{
  x: number,        // posisi x (0 to canvas.width)
  y: number,        // posisi y (0 to canvas.height)
  vx: number,       // kecepatan x (-0.5 to 0.5)
  vy: number,       // kecepatan y (-0.5 to 0.5)
  size: number,     // radius (1 to 3)
  opacity: number,  // (0.2 to 0.8)
  color: string,    // dari THEME_PARTICLE_COLORS[theme]
}
```

Particle count: `isMobile ? 80 : 200` — mobile detection via `window.innerWidth < 768`.

Mouse repulsion per frame:

```js
const dx = p.x - mouse.x;
const dy = p.y - mouse.y;
const dist = Math.sqrt(dx*dx + dy*dy);
if (dist < 120 && dist > 0) {
  const force = (120 - dist) / 120;
  p.vx += (dx / dist) * force * 0.5;
  p.vy += (dy / dist) * force * 0.5;
}
p.vx *= 0.98; // velocity damping
p.vy *= 0.98;
// boundary wrap
if (p.x < 0) p.x = canvas.width;
if (p.x > canvas.width) p.x = 0;
if (p.y < 0) p.y = canvas.height;
if (p.y > canvas.height) p.y = 0;
```

Resize handler: `window.addEventListener('resize', handleResize)` — reinitializes canvas dimensions.

### `components/ThemePicker.js`

```js
// Props:
//   theme: string           - tema aktif saat ini
//   userId: string          - untuk localStorage key
//   onThemeChange: function - callback(themeName)
```

Renders tiga tombol tema dengan preview color swatch. Menyimpan ke `localStorage` key `home_theme_{userId}` saat pilihan berubah. Setiap tombol memiliki `aria-pressed={theme === themeName}`.

### `components/TaskSummary.js`

```js
// Props:
//   tasks: array
//   loading: boolean
//   error: string | null
```

Menampilkan tiga stat: Total, Done, Pending. Clickable div → `router.push("/personal")`.

### `components/GreetingText.js`

```js
// Props:
//   user: object | null   - Supabase auth user (memiliki .email)
```

Menentukan nickname dari `EMAIL_NICKNAME_MAP` dan periode waktu dari jam lokal. Menggunakan `setInterval` setiap 60 detik untuk memeriksa perubahan periode waktu.

---

## Data Models

### Theme Definitions

```js
const THEMES = {
  vintage: {
    '--bg-main':    '#1a1612',
    '--bg-card':    '#242018',
    '--bg-card2':   '#2e2820',
    '--accent':     '#c8a96e',
    '--accent2':    '#a07850',
    '--text-main':  '#f0e6d3',
    '--text-muted': '#9c8a72',
    '--border':     '#3d3428',
  },
  minimal: {
    '--bg-main':    '#0d0d0d',
    '--bg-card':    '#1a1a1a',
    '--bg-card2':   '#222222',
    '--accent':     '#ffffff',
    '--accent2':    '#cccccc',
    '--text-main':  '#e0e0e0',
    '--text-muted': '#666666',
    '--border':     '#333333',
  },
  stellar: {
    '--bg-main':    '#050510',
    '--bg-card':    '#0a0a1e',
    '--bg-card2':   '#0f0f28',
    '--accent':     '#7090e0',
    '--accent2':    '#5070c0',
    '--text-main':  '#c8d8f0',
    '--text-muted': '#6070a0',
    '--border':     '#1a1a3a',
  },
};
```

### Particle Colors per Theme

```js
const THEME_PARTICLE_COLORS = {
  vintage: ['#c8a96e', '#9c8a72', '#a07850', '#f0e6d3'],
  minimal: ['#333333', '#444444', '#555555', '#222222'],
  stellar: ['#ffffff', '#c8d8f0', '#7090e0', '#a0b8e0'],
};
```

### Greeting Engine

```js
const EMAIL_NICKNAME_MAP = {
  'papa@example.com':   'Abah',
  'mama@example.com':  'Emak',
  'nemi@example.com': 'Tuan Muda',
  'venly@example.com':  'Penly',
};

function getTimePeriod(hour) {
  if (hour >= 5  && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 17) return 'Afternoon';
  if (hour >= 18 && hour <= 20) return 'Evening';
  return 'Night'; // 21-04
}

function getGreeting(email, hour) {
  const nickname = EMAIL_NICKNAME_MAP[email] ?? email.split('@')[0];
  const period   = getTimePeriod(hour);
  return `Good ${period} ${nickname}`;
}
```

### Clock Hand Rotation

```js
// Input: Date object
// Output: { hourDeg, minuteDeg, secondDeg }
function getHandAngles(date) {
  const h  = date.getHours();
  const m  = date.getMinutes();
  const s  = date.getSeconds();
  const ms = date.getMilliseconds();
  return {
    hourDeg:   (h % 12) * 30 + m * 0.5 + s * (0.5 / 60),
    minuteDeg: m * 6 + s * 0.1,
    secondDeg: s * 6 + ms * 0.006,
  };
}
```

### Supabase Query

```js
// personal_tasks relevant columns:
// id: uuid, user_id: uuid, title: text,
// status: 'pending'|'in_progress'|'done', updated_at: timestamptz

const { data, error } = await supabase
  .from('personal_tasks')
  .select('id, title, status')
  .eq('user_id', user.id);
```

---

## Visual Layout

```
+----------------------------------------------------------+
| Sidebar (220px fixed)  |  Main Content                   |
|                        |  margin-left: 220px             |
|  PARTAI WILHELMUS      |                                 |
|  [user info]           |  [ParticleCanvas - absolute     |
|                        |   background, z-index: 0]       |
|  * Home  <- active     |                                 |
|  * Personal            |  +------------------------+     |
|  * Family              |  |   AnalogClock (SVG)    |     |
|  * Summary             |  |   centered, ~280px     |     |
|  SPECTATE              |  +------------------------+     |
|  o papa                |                                 |
|  o mama                |  Good Morning Abah              |
|  o nemi                |  (GreetingText)                 |
|  o venly               |                                 |
|                        |  [TaskSummary: 5 | 2 | 3]       |
|  Logout                |                                 |
|                        |  [ThemePicker] <- fixed corner  |
+----------------------------------------------------------+
```

- `ParticleCanvas`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0`
- `ThemePicker`: `position: fixed; bottom: 2rem; right: 2rem; z-index: 10`
- Reduced Motion toggle: `position: fixed; top: 1rem; right: 1rem; z-index: 10`
- Clock centered: `display: flex; justify-content: center; padding-top: 4rem`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Clock hand angles are within valid range

*For any* valid `Date` object, `getHandAngles(date)` should return `hourDeg` in [0, 360), `minuteDeg` in [0, 360), and `secondDeg` in [0, 360).

**Validates: Requirements 2.3**

### Property 2: Clock face has exactly 12 numbers and 60 ticks

*For any* rendered `AnalogClock` component, the SVG should contain exactly 12 number label elements (1–12) and exactly 60 tick mark elements.

**Validates: Requirements 2.4**

### Property 3: Time format is always HH:MM:SS

*For any* `Date` object, `formatDigitalTime(date)` should return a string matching the pattern `\d{2}:\d{2}:\d{2}`.

**Validates: Requirements 3.1**

### Property 4: Time period mapping covers all 24 hours

*For any* integer hour in [0, 23], `getTimePeriod(hour)` should return exactly one of `'Morning'`, `'Afternoon'`, `'Evening'`, or `'Night'`.

**Validates: Requirements 4.1**

### Property 5: Email-to-nickname mapping is correct for all known accounts

*For any* email in `EMAIL_NICKNAME_MAP` and any hour in [0, 23], `getGreeting(email, hour)` should contain the correct nickname associated with that email.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 6: Unknown email falls back to local part

*For any* email address not present in `EMAIL_NICKNAME_MAP`, `getGreeting(email, hour)` should contain the local part of the email (portion before `@`) as the nickname.

**Validates: Requirements 4.7**

### Property 7: All particles are initialized within canvas bounds

*For any* canvas width W and height H, every particle from `initParticles(W, H, count)` should satisfy `0 <= p.x <= W` and `0 <= p.y <= H`.

**Validates: Requirements 5.2**

### Property 8: Mouse repulsion increases particle distance from cursor

*For any* particle within 120px of the cursor, after one application of `applyRepulsion(particle, mouseX, mouseY)`, the particle's distance from the cursor should be greater than or equal to its distance before repulsion.

**Validates: Requirements 5.3**

### Property 9: Canvas dimensions match viewport after resize

*For any* new viewport width W and height H, after the resize handler fires, `canvas.width === W` and `canvas.height === H`.

**Validates: Requirements 5.9**

### Property 10: Theme persistence round-trip

*For any* userId and theme name in `['vintage', 'minimal', 'stellar']`, calling `saveTheme(userId, theme)` then `loadTheme(userId)` should return the same theme name.

**Validates: Requirements 6.2, 6.3**

### Property 11: Theme CSS variables match specification

*For any* theme in `['vintage', 'minimal', 'stellar']`, after `applyTheme(theme)` is called, each CSS variable on `:root` should match the value defined in the `THEMES` constant for that theme.

**Validates: Requirements 6.6, 6.7, 6.8**

### Property 12: Task summary counts are consistent

*For any* array of tasks, `computeTaskCounts(tasks)` should return `total === tasks.length`, `done === tasks.filter(t => t.status === 'done').length`, and `pending === total - done`.

**Validates: Requirements 7.2**

### Property 13: Reduced motion preference persistence

*For any* userId, calling `saveReducedMotion(userId, true)` then `loadReducedMotion(userId)` should return `true`.

**Validates: Requirements 8.4**

### Property 14: Analog clock aria-label describes current time

*For any* `Date` object, `getClockAriaLabel(date)` should return a string that contains the hour, minute, and second values from that date in human-readable form.

**Validates: Requirements 8.6**

---

## Error Handling

### Auth Errors
- `supabase.auth.getUser()` gagal atau session null → `router.push("/login")` segera.
- Tidak ada retry; pengguna harus login ulang.

### Task Fetch Errors
- Supabase query error → `setTaskError("Gagal memuat tugas")`, `setTasks([])`.
- `TaskSummary` menampilkan pesan error, tidak menampilkan angka.

### localStorage Errors
- Semua akses localStorage dibungkus `try/catch`; fallback ke nilai default (tema `vintage`, `reducedMotion: false`).

### Canvas Errors
- Jika `canvas.getContext('2d')` mengembalikan null, `ParticleCanvas` tidak merender apapun (graceful degradation).

### Particle Boundary
- Partikel yang keluar batas canvas di-wrap (bukan di-clamp) untuk efek seamless.

---

## Testing Strategy

### Dual Testing Approach

Unit tests dan property-based tests bersifat komplementer dan keduanya diperlukan.

- **Unit tests**: verifikasi contoh spesifik, edge cases, error conditions, dan integrasi komponen.
- **Property tests**: verifikasi properti universal yang berlaku untuk semua input yang valid.

### Property-Based Testing Library

Gunakan **fast-check** (JavaScript/Node.js):

```
npm install --save-dev fast-check
```

Setiap property test dikonfigurasi dengan minimum **100 iterasi** (`numRuns: 100`).
Tag format: `// Feature: home-clock-v2, Property N: <property_text>`

### Property Test Implementations

```js
import fc from 'fast-check';
import { getHandAngles, formatDigitalTime, getTimePeriod,
         getGreeting, EMAIL_NICKNAME_MAP, initParticles,
         applyRepulsion, saveTheme, loadTheme,
         computeTaskCounts, saveReducedMotion, loadReducedMotion,
         getClockAriaLabel } from '../lib/home-clock-utils';

// Feature: home-clock-v2, Property 1: Clock hand angles are within valid range
test('Property 1', () => {
  fc.assert(fc.property(
    fc.date({ min: new Date(0), max: new Date(2100, 0, 1) }),
    (date) => {
      const { hourDeg, minuteDeg, secondDeg } = getHandAngles(date);
      return hourDeg >= 0 && hourDeg < 360
          && minuteDeg >= 0 && minuteDeg < 360
          && secondDeg >= 0 && secondDeg < 360;
    }
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 3: Time format is always HH:MM:SS
test('Property 3', () => {
  fc.assert(fc.property(
    fc.date(),
    (date) => /^\d{2}:\d{2}:\d{2}$/.test(formatDigitalTime(date))
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 4: Time period mapping covers all 24 hours
test('Property 4', () => {
  fc.assert(fc.property(
    fc.integer({ min: 0, max: 23 }),
    (hour) => ['Morning', 'Afternoon', 'Evening', 'Night'].includes(getTimePeriod(hour))
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 5: Email-to-nickname mapping is correct
test('Property 5', () => {
  fc.assert(fc.property(
    fc.constantFrom(...Object.keys(EMAIL_NICKNAME_MAP)),
    fc.integer({ min: 0, max: 23 }),
    (email, hour) => getGreeting(email, hour).includes(EMAIL_NICKNAME_MAP[email])
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 6: Unknown email falls back to local part
test('Property 6', () => {
  fc.assert(fc.property(
    fc.emailAddress().filter(e => !(e in EMAIL_NICKNAME_MAP)),
    fc.integer({ min: 0, max: 23 }),
    (email, hour) => getGreeting(email, hour).includes(email.split('@')[0])
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 7: All particles initialized within canvas bounds
test('Property 7', () => {
  fc.assert(fc.property(
    fc.integer({ min: 100, max: 3840 }),
    fc.integer({ min: 100, max: 2160 }),
    fc.integer({ min: 1, max: 200 }),
    (W, H, count) => {
      const particles = initParticles(W, H, count);
      return particles.every(p => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H);
    }
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 10: Theme persistence round-trip
test('Property 10', () => {
  fc.assert(fc.property(
    fc.uuid(),
    fc.constantFrom('vintage', 'minimal', 'stellar'),
    (userId, theme) => { saveTheme(userId, theme); return loadTheme(userId) === theme; }
  ), { numRuns: 100 });
});

// Feature: home-clock-v2, Property 12: Task summary counts are consistent
test('Property 12', () => {
  fc.assert(fc.property(
    fc.array(fc.record({
      id: fc.uuid(),
      title: fc.string(),
      status: fc.constantFrom('pending', 'in_progress', 'done'),
    })),
    (tasks) => {
      const { total, done, pending } = computeTaskCounts(tasks);
      return total === tasks.length
          && done === tasks.filter(t => t.status === 'done').length
          && pending === total - done;
    }
  ), { numRuns: 100 });
});
```

### Unit Test Coverage

Unit tests (Jest + React Testing Library) fokus pada:

- Auth guard: render `HomePage` tanpa session → `router.push("/login")` dipanggil
- Login redirect: submit form login sukses → `router.push("/home")` dipanggil
- Reduced motion auto-detect: `prefers-reduced-motion: reduce` → `reducedMotion` state `true`
- `TaskSummary` error state: Supabase error → pesan "Gagal memuat tugas" tampil
- `TaskSummary` loading state: loading `true` → loading indicator tampil
- `TaskSummary` click: klik area → `router.push("/personal")` dipanggil
- `ThemePicker` active indicator: tema aktif memiliki `aria-pressed="true"`
- `Sidebar` Home item: item pertama di nav adalah `/home`
- `Sidebar` active state: pathname `/home` → item Home dalam state aktif
- `AnalogClock` aria-label: mengandung jam, menit, detik saat ini
- Digital clock toggle: klik tombol toggle → `DigitalClock` tampil
- Reduced motion toggle: klik tombol → preferensi tersimpan di localStorage
- ARIA live regions: elemen `aria-live="polite"` ada untuk waktu dan greeting
