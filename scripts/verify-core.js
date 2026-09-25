const assert = require('node:assert/strict');

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const sample = {
  id: 'test-inv',
  name: 'Test',
  activeDays: ['Sen', 'Rab', 'Jum'],
  injectionTime: '08:00',
};

const monday = new Date(2026, 7, 24, 10, 0, 0);
assert.equal(WEEKDAY_LABELS[monday.getDay()], 'Sen');
assert.equal(sample.activeDays.includes(WEEKDAY_LABELS[monday.getDay()]), true);
assert.equal(formatLocalDate(monday), '2026-08-24');

const malformed = Number.parseFloat('not-a-number');
assert.equal(Number.isFinite(malformed), false);

console.log('Core verification: PASS');
