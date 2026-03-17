/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock supabase
jest.mock('../../../Lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: '1', username: 'test' } })),
        })),
      })),
    })),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/verse',
}));

import { supabase } from '../../../Lib/supabaseClient';
import VersePage from '../page';
import Sidebar from '../../../components/Sidebar';

const BOOK_LIST = [
  { name: 'Yohanes', abbr: 'yoh', chapters: 21 },
];

const PASSAGE_RESPONSE = {
  verses: [
    { verse: 3, text: 'Karena begitu besar kasih Allah akan dunia ini.' },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockClear();
});

// 5.1 Auth guard: no session → redirect to /login
test('5.1 auth guard: no session redirects to /login', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

  render(<VersePage />);

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

// 5.2 Loading state: while fetch is running → "LOADING..." is shown
test('5.2 loading state: shows LOADING... while fetching', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  // Never-resolving fetch
  global.fetch = jest.fn(() => new Promise(() => {}));

  render(<VersePage />);

  expect(screen.getByText('LOADING...')).toBeInTheDocument();
});

// 5.3 Error state HTTP: fetch returns status 500 → error message shown
test('5.3 error state HTTP: fetch 500 shows error message', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, status: 500 })
  );

  render(<VersePage />);

  await waitFor(() => {
    expect(screen.getByText(/API error: 500/i)).toBeInTheDocument();
  });
});

// 5.4 Error state network: fetch throws Error → error message shown
test('5.4 error state network: fetch throws shows error message', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  global.fetch = jest.fn(() => Promise.reject(new Error('Network failure')));

  render(<VersePage />);

  await waitFor(() => {
    expect(
      screen.getByText(/Gagal memuat daftar kitab/i)
    ).toBeInTheDocument();
  });
});

// 5.5 Error state empty verses: { verses: [] } → error message shown
test('5.5 error state empty verses: shows error when verses array is empty', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(BOOK_LIST) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ verses: [] }) });

  render(<VersePage />);

  await waitFor(() => {
    expect(
      screen.getByText(/Tidak ada ayat ditemukan/i)
    ).toBeInTheDocument();
  });
});

// 5.6 Success state: fetch succeeds → verse text, reference, and "TB" shown
test('5.6 success state: shows verse text, reference, and TB label', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(BOOK_LIST) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(PASSAGE_RESPONSE) });

  render(<VersePage />);

  await waitFor(() => {
    expect(
      screen.getByText(/Karena begitu besar kasih Allah/i)
    ).toBeInTheDocument();
  });

  // Reference format: "Yohanes 1:3" (chapter picked from [1..21], verse.verse = 3)
  expect(screen.getByText(/Yohanes/i)).toBeInTheDocument();
  expect(screen.getByText('TB')).toBeInTheDocument();
});

// 5.7 Label "VERSE OF THE DAY" is on the page
test('5.7 label VERSE OF THE DAY is present', async () => {
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } } });
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(BOOK_LIST) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(PASSAGE_RESPONSE) });

  render(<VersePage />);

  await waitFor(() => {
    expect(screen.getByText('VERSE OF THE DAY')).toBeInTheDocument();
  });
});

// 5.8 Sidebar: /verse link with ✝ icon exists, /summary link does not exist
test('5.8 sidebar has /verse link with ✝ icon and no /summary link', () => {
  render(<Sidebar user={null} />);

  // /verse link exists
  const verseLink = screen.getByRole('link', { name: /✝/i });
  expect(verseLink).toBeInTheDocument();
  expect(verseLink).toHaveAttribute('href', '/verse');

  // /summary link does not exist
  const summaryLink = screen.queryByRole('link', { name: /summary/i });
  expect(summaryLink).toBeNull();
});
