const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Test getTodayDateString (WIB timezone handling)
function getTodayDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

test('getTodayDateString handles early morning Jakarta time without UTC day skew', () => {
  // 05:30 AM WIB on Oct 30 is still 22:30 on Oct 29 in UTC
  const earlyMorningWIB = new Date('2026-10-30T05:30:00+07:00');
  
  assert.equal(earlyMorningWIB.toISOString().split('T')[0], '2026-10-29', 'UTC string incorrectly rolls back to yesterday');
  assert.equal(getTodayDateString(earlyMorningWIB), '2026-10-30', 'Jakarta timezone correctly preserves today');
});

test('getTodayDateString formats consistently as YYYY-MM-DD', () => {
  const result = getTodayDateString();
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

// 2. Test Role Detection Logic (isKepalaSekolah)
function isKepalaSekolah(user, profile) {
  if (!user && !profile) return false;
  const role = user?.user_metadata?.role || profile?.role;
  const jabatan = user?.user_metadata?.jabatan || profile?.jabatan;
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  return (
    role === 'kepala_sekolah' ||
    jabatan === 'kepala_sekolah' ||
    email === 'kepsek@demo.com'
  );
}

test('isKepalaSekolah accurately identifies executive role', () => {
  assert.equal(isKepalaSekolah(null, null), false);
  assert.equal(isKepalaSekolah({ email: 'guru@sdnlatsari.sch.id', user_metadata: { role: 'guru' } }), false);
  assert.equal(isKepalaSekolah({ email: 'kepsek@demo.com' }), true);
  assert.equal(isKepalaSekolah(null, { role: 'kepala_sekolah' }), true);
  assert.equal(isKepalaSekolah(null, { jabatan: 'kepala_sekolah', role: 'guru' }), true);
});

// 3. Test Grade Average and KKM logic
function calculateSubjectAverage(scores) {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, curr) => acc + (curr.nilai || 0), 0);
  return Math.round(sum / scores.length);
}

test('calculateSubjectAverage correctly computes rounded average', () => {
  const sampleScores = [{ nilai: 75 }, { nilai: 80 }, { nilai: 84 }];
  // (75 + 80 + 84) / 3 = 79.67 => rounds to 80
  assert.equal(calculateSubjectAverage(sampleScores), 80);
});

test('calculateSubjectAverage handles empty arrays safely', () => {
  assert.equal(calculateSubjectAverage([]), 0);
  assert.equal(calculateSubjectAverage(null), 0);
});

// 4. Test Class Name Normalization
function normalizeClassName(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/^kelas\s*/i, '')
    .replace(/\s+/g, '')
    .trim();
}

test('normalizeClassName handles diverse formats correctly', () => {
  assert.equal(normalizeClassName('Kelas 4A'), '4a');
  assert.equal(normalizeClassName('Kelas IV'), 'iv');
  assert.equal(normalizeClassName('  kelas  1  '), '1');
});

// 5. Test KAIH Foreign Key & Payload Sanitization
function sanitizeKaihPayload(raw) {
  return {
    ...raw,
    kelas_id: raw.kelas_id && raw.kelas_id !== 'c1-4a' ? raw.kelas_id : null,
    siswa_id: raw.siswa_id && raw.siswa_id !== 's-1' ? raw.siswa_id : null,
  };
}

test('sanitizeKaihPayload eliminates prototype dummy foreign keys (c1-4a and s-1)', () => {
  const dummyPayload = {
    id: 'kaih-12345',
    kelas_id: 'c1-4a',
    siswa_id: 's-1',
    judul: 'Sholat Dhuha',
  };
  const sanitized = sanitizeKaihPayload(dummyPayload);
  assert.equal(sanitized.kelas_id, null, 'Dummy c1-4a must be sanitized to null');
  assert.equal(sanitized.siswa_id, null, 'Dummy s-1 must be sanitized to null');
});

test('sanitizeKaihPayload preserves valid UUID foreign keys', () => {
  const validPayload = {
    id: 'kaih-12345',
    kelas_id: 'f8ca2451-a6e3-4665-8f4b-629c7c735d05',
    siswa_id: '2fa978ec-2541-4c8d-b491-c4896a6a6ffa',
    judul: 'Bangun Pagi',
  };
  const sanitized = sanitizeKaihPayload(validPayload);
  assert.equal(sanitized.kelas_id, 'f8ca2451-a6e3-4665-8f4b-629c7c735d05');
  assert.equal(sanitized.siswa_id, '2fa978ec-2541-4c8d-b491-c4896a6a6ffa');
});
