/* ═══════════════════════════════════════════════════════════════
   Visual TKB – app.js
   Parse Excel (SheetJS) → render real-time timetable preview
═══════════════════════════════════════════════════════════════ */

// ── Timetable constants ──────────────────────────────────────
const DEFAULT_GRID_START_H = 7;    // 07:00
const DEFAULT_GRID_END_H   = 18;   // default 18:00
const MAX_GRID_END_H       = 21;   // max evening hour

// Column order: Mon=1, Tue=2, ..., Sat=6, Sun=0 (JS day)
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS   = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const DAY_NAME_TO_IDX = {
  'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3,
  'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6,
  'Chủ Nhật': 0,
};

// TDMU Official Tiết Time Table mapping
const TIET_TIMES = {
  1:  '07:00 - 07:50',
  2:  '07:50 - 08:40',
  3:  '08:40 - 09:30',
  4:  '09:45 - 10:35',
  5:  '10:35 - 11:25',
  6:  '11:25 - 12:15',
  7:  '13:00 - 13:50',
  8:  '13:50 - 14:40',
  9:  '14:40 - 15:30',
  10: '15:45 - 16:35',
  11: '16:35 - 17:25',
  12: '17:25 - 18:15',
  13: '18:30 - 19:20',
  14: '19:20 - 20:10',
  15: '20:10 - 21:00',
};

// Rich, high-contrast palette for light background (12 colors)
const PALETTE = [
  '#4f46e5','#7c3aed','#db2777','#0d9488',
  '#d97706','#059669','#e11d48','#2563eb',
  '#9333ea','#0891b2','#65a30d','#ea580c',
];

// ── App State ────────────────────────────────────────────────
let subjects         = [];
let selectedSubjects = new Set();
let colorMap         = {};          // maMH → hex color
let currentMonday    = null;        // Date of current week's Monday
let allMinDates      = [];          // all parsed Date objects (from/to)

// ── Utility: Time ────────────────────────────────────────────
function hhmm2min(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function min2hhmm(min) {
  return `${String(Math.floor(min / 60)).padStart(2,'0')}:${String(min % 60).padStart(2,'0')}`;
}

// ── Map "HH:MM" to Tiết index (1 to 15) based on official TDMU schedule ────
function startTimeToTiet(hhmm) {
  const min = hhmm2min(hhmm);
  if (min <= 7 * 60 + 45)  return 1;   // 07:00 -> Tiết 1
  if (min <= 8 * 60 + 35)  return 2;   // 07:50 -> Tiết 2
  if (min <= 9 * 60 + 25)  return 3;   // 08:40 -> Tiết 3
  if (min <= 10 * 60 + 30) return 4;   // 09:45 -> Tiết 4
  if (min <= 11 * 60 + 20) return 5;   // 10:35 -> Tiết 5
  if (min <= 12 * 60 + 15) return 6;   // 11:25 -> Tiết 6
  if (min <= 13 * 60 + 45) return 7;   // 13:00 -> Tiết 7
  if (min <= 14 * 60 + 35) return 8;   // 13:50 -> Tiết 8
  if (min <= 15 * 60 + 25) return 9;   // 14:40 -> Tiết 9
  if (min <= 16 * 60 + 30) return 10;  // 15:45 -> Tiết 10
  if (min <= 17 * 60 + 20) return 11;  // 16:35 -> Tiết 11
  if (min <= 18 * 60 + 15) return 12;  // 17:25 -> Tiết 12
  if (min <= 19 * 60 + 15) return 13;  // 18:30 -> Tiết 13
  if (min <= 20 * 60 + 5)  return 14;  // 19:20 -> Tiết 14
  return 15;                           // 20:10 -> Tiết 15
}

function endTimeToTiet(hhmm) {
  const min = hhmm2min(hhmm);
  if (min <= 7 * 60 + 55)  return 1;   // 07:50 -> Tiết 1
  if (min <= 8 * 60 + 45)  return 2;   // 08:40 -> Tiết 2
  if (min <= 9 * 60 + 35)  return 3;   // 09:30 -> Tiết 3
  if (min <= 10 * 60 + 40) return 4;   // 10:35 -> Tiết 4
  if (min <= 11 * 60 + 30) return 5;   // 11:25 -> Tiết 5
  if (min <= 12 * 60 + 30) return 6;   // 12:15 -> Tiết 6
  if (min <= 13 * 60 + 55) return 7;   // 13:50 -> Tiết 7
  if (min <= 14 * 60 + 45) return 8;   // 14:40 -> Tiết 8
  if (min <= 15 * 60 + 35) return 9;   // 15:30 -> Tiết 9
  if (min <= 16 * 60 + 40) return 10;  // 16:35 -> Tiết 10
  if (min <= 17 * 60 + 30) return 11;  // 17:25 -> Tiết 11
  if (min <= 18 * 60 + 25) return 12;  // 18:15 -> Tiết 12
  if (min <= 19 * 60 + 25) return 13;  // 19:20 -> Tiết 13
  if (min <= 20 * 60 + 15) return 14;  // 20:10 -> Tiết 14
  return 15;                           // 21:00 -> Tiết 15
}

// ── Utility: Date ────────────────────────────────────────────
/** Parse "DD/MM/YY" → Date */
function parseDMY(str) {
  str = (str || '').trim();
  const p = str.split('/');
  if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number);
  if (!d || !m || isNaN(y)) return null;
  return new Date(2000 + y, m - 1, d);
}

/** Get Monday (00:00:00) of the week containing `date` */
function getMonday(date) {
  const d  = new Date(date);
  const dw = d.getDay(); // 0=Sun
  const diff = dw === 0 ? -6 : 1 - dw;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format date as "dd/MM/yyyy" */
function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

/** Is date equal to today? */
function isToday(d) {
  const t = new Date();
  return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear();
}

// ── Parse "Buổi học" string ──────────────────────────────────
/**
 * Format per line:
 *   Thứ X,từ HH:MM đến HH:MM,Ph ROOM,GV NAME,DD/MM/YY[ đến DD/MM/YY]
 */
function parseBuoiHoc(raw) {
  if (!raw) return [];
  const sessions = [];

  for (const line of raw.split('\n')) {
    const l = line.trim();
    if (!l) continue;

    // Split by comma
    const parts = l.split(',');
    if (parts.length < 5) continue;

    const dayStr  = parts[0].trim();
    const timeStr = parts[1].trim();
    const room    = parts[2].trim().replace(/^Ph\s+/, '');
    const gv      = parts[3].trim().replace(/^GV\s+/, '');
    const datePart = parts.slice(4).join(',').trim();

    // Time: "từ HH:MM đến HH:MM"
    const tMatch = timeStr.match(/từ\s+(\d{2}:\d{2})\s+đến\s+(\d{2}:\d{2})/);
    if (!tMatch) continue;
    const [, startTime, endTime] = tMatch;

    // Validate time is valid day range (06:00 to 22:00)
    if (hhmm2min(startTime) < 6 * 60 ||
        hhmm2min(endTime)   > 22 * 60) continue;

    // Date range: "DD/MM/YY đến DD/MM/YY" or single "DD/MM/YY"
    let fromDate, toDate;
    if (datePart.includes('đến')) {
      const dp = datePart.split('đến');
      fromDate = parseDMY(dp[0]);
      toDate   = parseDMY(dp[1]);
    } else {
      fromDate = toDate = parseDMY(datePart);
    }
    if (!fromDate || !toDate) continue;

    const dayIdx = DAY_NAME_TO_IDX[dayStr];
    if (dayIdx === undefined) continue;

    sessions.push({ dayIdx, startTime, endTime, room, gv, fromDate, toDate });
  }

  return sessions;
}

// ── Parse Excel (SheetJS) ────────────────────────────────────
async function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        const result = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          // Columns: [0]=STT [1]=Mã MH [2]=Tên MH [5]=TC [6]=BB [7]=Nhóm [8]=GV [9]=Lớp [10]=BuổiHọc [11]=Học
          const maMH = r[1] != null ? String(r[1]).trim() : null;
          const tenMH = r[2] != null ? String(r[2]).trim() : null;
          if (!maMH || !tenMH) continue;

          const soTC   = r[5] ? Number(r[5]) : 0;
          const batBuoc = r[6] != null && String(r[6]).trim().toLowerCase() === 'x';
          const nhom   = r[7] != null ? String(r[7]).trim() : null;
          const gv     = r[8] != null ? String(r[8]).trim() : null;
          const lop    = r[9] != null ? String(r[9]).trim() : null;
          const buoiHocRaw = r[10] != null ? String(r[10]).trim() : null;
          const daHoc  = r[11] != null && String(r[11]).trim().toLowerCase() === 'x';

          const sessions = parseBuoiHoc(buoiHocRaw);
          result.push({ maMH, tenMH, soTC, batBuoc, nhom, gv, lop, sessions, daHoc, hasSchedule: sessions.length > 0 });
        }
        resolve(result);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Positioning: handle overlapping sessions in a day column ──
function positionSessions(dayBlocks) {
  if (!dayBlocks.length) return [];
  const sorted = [...dayBlocks].sort((a, b) => hhmm2min(a.startTime) - hhmm2min(b.startTime));

  // Greedy interval slot assignment
  const slots = []; // each slot = array of {endMin}
  const assignment = sorted.map(sess => {
    const sMin = hhmm2min(sess.startTime);
    const eMin = hhmm2min(sess.endTime);
    let slotIdx = -1;
    for (let si = 0; si < slots.length; si++) {
      if (slots[si].lastEnd <= sMin) {
        slots[si].lastEnd = eMin;
        slotIdx = si;
        break;
      }
    }
    if (slotIdx === -1) {
      slotIdx = slots.length;
      slots.push({ lastEnd: eMin });
    }
    return { sess, slotIdx };
  });

  const total = slots.length;
  return assignment.map(({ sess, slotIdx }) => ({
    sess,
    leftPct:  (slotIdx / total) * 100,
    widthPct: (1 / total) * 100,
  }));
}

// ── Conflict detection ────────────────────────────────────────
/**
 * Returns a Set of conflict keys: `${maMH}|${colIdx}|${startTime}`
 */
function detectConflicts(weekBlocks) {
  const conflicts = new Set();
  for (let i = 0; i < weekBlocks.length; i++) {
    for (let j = i + 1; j < weekBlocks.length; j++) {
      const a = weekBlocks[i];
      const b = weekBlocks[j];
      if (a.colIdx !== b.colIdx) continue;
      if (a.maMH === b.maMH) continue;
      const aS = hhmm2min(a.startTime), aE = hhmm2min(a.endTime);
      const bS = hhmm2min(b.startTime), bE = hhmm2min(b.endTime);
      if (aS < bE && aE > bS) {
        conflicts.add(`${a.maMH}|${a.colIdx}|${a.startTime}`);
        conflicts.add(`${b.maMH}|${b.colIdx}|${b.startTime}`);
      }
    }
  }
  return conflicts;
}

// ── Render Subject List ───────────────────────────────────────
function renderSubjectList() {
  // Update credits
  const selArr = subjects.filter(s => selectedSubjects.has(s.maMH));
  const regArr = subjects.filter(s => s.daHoc);

  document.getElementById('selected-credits').textContent =
    selArr.reduce((n, s) => n + s.soTC, 0);
  document.getElementById('registered-credits').textContent =
    regArr.reduce((n, s) => n + s.soTC, 0);
  document.getElementById('total-credits').textContent =
    subjects.reduce((n, s) => n + s.soTC, 0);

  // Build list HTML
  const withSched = subjects.filter(s => s.hasSchedule);
  const noSched   = subjects.filter(s => !s.hasSchedule);

  let html = '';

  if (withSched.length) {
    html += `<div class="subject-group-label">Có lịch học (${withSched.length})</div>`;
    html += withSched.map(s => subjectItemHTML(s)).join('');
  }
  if (noSched.length) {
    html += `<div class="subject-group-label" style="margin-top:8px">Chưa có lịch (${noSched.length})</div>`;
    html += noSched.map(s => subjectItemHTML(s)).join('');
  }

  document.getElementById('subject-list').innerHTML = html;
}

function subjectItemHTML(s) {
  const color  = colorMap[s.maMH];
  const isSel  = selectedSubjects.has(s.maMH);
  const bgHex  = hexToRgba(color, 0.15);

  return `
  <div class="subject-item ${isSel ? 'selected' : ''} ${!s.hasSchedule ? 'no-schedule' : ''}"
       id="item-${s.maMH}"
       onclick="${s.hasSchedule ? `toggleSubject('${s.maMH}')` : ''}">
    <div class="subject-color-bar" style="background:${color}"></div>
    <div class="subject-checkbox ${isSel ? 'checked' : ''}"
         style="${isSel ? `background:${color};border-color:${color}` : ''}">
      ${isSel ? `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
    </div>
    <div class="subject-info">
      <div class="subject-name">${s.tenMH}</div>
      <div class="subject-meta">
        <span class="subject-code">${s.maMH}</span>
        ${s.nhom ? `<span class="subject-group">${s.nhom}</span>` : ''}
        <span class="subject-tc">${s.soTC} TC</span>
        ${s.batBuoc ? `<span class="badge-required">Bắt buộc</span>` : ''}
        ${s.daHoc  ? `<span style="font-size:9.5px;color:#10b981;font-weight:600">✓ Đã ĐK</span>` : ''}
      </div>
      ${s.gv ? `<div class="subject-gv">${s.gv}</div>` : ''}
      ${!s.hasSchedule ? `<div class="no-schedule-note">⚠ Chưa có lịch</div>` : ''}
    </div>
  </div>`;
}

// ── Render Timetable ──────────────────────────────────────────
function renderTimetable() {
  const gridEl  = document.getElementById('timetable-grid');
  const weekLbl = document.getElementById('week-label');
  const weekSub = document.getElementById('week-sub');

  if (!currentMonday) return;

  // Week dates: Mon…Sun
  const weekDates = DISPLAY_DAYS.map(dayJS => {
    const offset = dayJS === 0 ? 6 : dayJS - 1; // offset from Monday
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + offset);
    return d;
  });

  weekLbl.textContent = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}`;
  weekSub.textContent = 'Nhấn ← → để chuyển tuần';

  // Collect all sessions for this week from selected subjects
  const weekBlocks = []; // { maMH, tenMH, startTime, endTime, room, gv, nhom, colIdx }

  for (const subj of subjects) {
    if (!selectedSubjects.has(subj.maMH)) continue;
    for (const sess of subj.sessions) {
      // Find column index (0=Mon … 6=Sun)
      const colIdx = DISPLAY_DAYS.indexOf(sess.dayIdx);
      if (colIdx < 0) continue;

      const date = weekDates[colIdx];
      // Check if this session occurs on `date`
      const dateMS = date.getTime();
      const fromMS = sess.fromDate.getTime();
      const toMS   = sess.toDate.getTime();
      if (dateMS < fromMS || dateMS > toMS) continue;
      if (date.getDay() !== sess.dayIdx) continue;

      weekBlocks.push({
        maMH:      subj.maMH,
        tenMH:     subj.tenMH,
        nhom:      subj.nhom,
        startTime: sess.startTime,
        endTime:   sess.endTime,
        room:      sess.room,
        gv:        sess.gv,
        colIdx,
      });
    }
  }

  // Conflicts
  const conflicts = detectConflicts(weekBlocks);
  const conflictCount = new Set(
    [...conflicts].map(k => k.split('|')[0] + '|' + k.split('|')[1])
  ).size / 2;

  const badge = document.getElementById('conflict-badge');
  const conflictPairs = Math.round([...conflicts].length / 2);
  if (conflictPairs > 0) {
    document.getElementById('conflict-text').textContent = `${conflictPairs} xung đột giờ học`;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Determine dynamic max Tiết needed (default 12 to cover morning & afternoon)
  let totalTietCount = 12;
  for (const b of weekBlocks) {
    const endT = endTimeToTiet(b.endTime);
    if (endT > totalTietCount) totalTietCount = Math.min(15, endT);
  }

  // Calculate container available height for grid body
  const wrapEl = document.querySelector('.timetable-scroll-wrap');
  const wrapH = wrapEl && wrapEl.clientHeight > 100 ? wrapEl.clientHeight : 550;
  
  // Available height for tt-body = wrapH - header height (~34px) - wrapper paddings
  const targetBodyH = Math.max(300, wrapH - 34);
  const rowH = targetBodyH / totalTietCount;
  const gridH = targetBodyH;

  // ── Build HTML ──
  let html = '';

  // Header
  html += `<div class="tt-header">`;
  html += `<div class="tt-header-nav-btn" onclick="document.getElementById('prev-week').click()" title="Tuần trước"><b>←</b></div>`;
  for (let ci = 0; ci < 7; ci++) {
    const d = weekDates[ci];
    const todayCls = isToday(d) ? 'today-col' : '';
    const dayDateStr = `(${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')})`;
    html += `
      <div class="tt-header-day ${todayCls}">
        <span class="day-name-label">${DAY_LABELS[ci]}</span>
        <span class="day-date-label">${dayDateStr}</span>
      </div>`;
  }
  html += `<div class="tt-header-nav-btn" onclick="document.getElementById('next-week').click()" title="Tuần tiếp"><b>→</b></div>`;
  html += `</div>`;

  // Body
  html += `<div class="tt-body">`;

  // Left Tiết Axis
  html += `<div class="tt-tiet-axis" style="height:${gridH}px">`;
  for (let t = 1; t <= totalTietCount; t++) {
    const timeStr = TIET_TIMES[t] || '';
    html += `
      <div class="tiet-label-cell">
        <div class="tiet-name">Tiết ${t}</div>
        <div class="tiet-time">${timeStr}</div>
      </div>`;
  }
  html += `</div>`;

  // Day columns
  for (let ci = 0; ci < 7; ci++) {
    const todayCls = isToday(weekDates[ci]) ? 'today-col' : '';
    html += `<div class="tt-day-col ${todayCls}" style="height:${gridH}px">`;

    // Horizontal Tiet grid lines
    for (let t = 1; t <= totalTietCount; t++) {
      const top = Math.round((t - 1) * rowH);
      html += `<div class="tt-tiet-line" style="top:${top}px"></div>`;
    }

    // Session blocks for this column
    const colBlocks = weekBlocks.filter(b => b.colIdx === ci);
    const positioned = positionSessions(colBlocks);

    for (const { sess, leftPct, widthPct } of positioned) {
      const startT = startTimeToTiet(sess.startTime);
      const endT   = Math.max(startT, endTimeToTiet(sess.endTime));
      
      const top    = Math.round((startT - 1) * rowH);
      const height = Math.max(Math.round((endT - startT + 1) * rowH) - 1, 20);
      const key    = `${sess.maMH}|${ci}|${sess.startTime}`;
      const isConf = conflicts.has(key);

      const leftPx   = leftPct > 0 ? `calc(${leftPct}% + 2px)` : '2px';
      const widthVal = widthPct < 100 ? `calc(${widthPct}% - 4px)` : 'calc(100% - 4px)';

      html += `
        <div class="session-block ${isConf ? 'conflict-block' : ''}"
             style="
               top:${top}px;
               height:${height}px;
               left:${leftPx};
               width:${widthVal};
             "
             title="${sess.tenMH}&#10;${sess.startTime}–${sess.endTime}&#10;${sess.room}&#10;${sess.gv || ''}">
          <div class="session-subject-name">${sess.tenMH}${sess.soTC ? ' (' + sess.soTC + ')' : ''} (${sess.maMH})</div>
          ${height >= 34 && sess.nhom ? `<div class="session-detail"><b>Nhóm:</b> ${sess.nhom}</div>` : ''}
          ${height >= 48 ? `<div class="session-detail"><b>Phòng:</b> ${sess.room}</div>` : ''}
          ${height >= 62 && sess.gv ? `<div class="session-detail"><b>GV:</b> ${sess.gv}</div>` : ''}
          ${isConf ? `<div class="conflict-tag">⚠ Xung đột!</div>` : ''}
        </div>`;
    }

    html += `</div>`; // .tt-day-col
  }

  // Right Accent Bar
  html += `<div class="tt-right-bar" style="height:${gridH}px"></div>`;

  html += `</div>`; // .tt-body

  gridEl.innerHTML = html;
}

// ── Toggle subject selection ──────────────────────────────────
function toggleSubject(maMH) {
  if (selectedSubjects.has(maMH)) {
    selectedSubjects.delete(maMH);
  } else {
    selectedSubjects.add(maMH);
  }
  renderSubjectList();
  renderTimetable();
}

// ── Load file ─────────────────────────────────────────────────
async function loadFile(file) {
  const ua = document.getElementById('upload-area');
  ua.innerHTML = `<div class="loading"><span class="spinner"></span> Đang đọc file...</div>`;
  ua.style.cursor = 'default';

  try {
    subjects = await parseExcel(file);

    // Assign colors
    subjects.forEach((s, i) => {
      colorMap[s.maMH] = PALETTE[i % PALETTE.length];
    });

    // Collect all dates to find semester range
    allMinDates = [];
    for (const s of subjects) {
      for (const sess of s.sessions) {
        allMinDates.push(sess.fromDate, sess.toDate);
      }
    }

    // Set initial week = week of earliest class
    if (allMinDates.length) {
      const minDate = new Date(Math.min(...allMinDates.map(d => d.getTime())));
      currentMonday = getMonday(minDate);
    } else {
      currentMonday = getMonday(new Date());
    }

    // Pre-select subjects with 'x' in Học column AND have schedule
    selectedSubjects = new Set(
      subjects.filter(s => s.daHoc && s.hasSchedule).map(s => s.maMH)
    );

    // Update upload area
    ua.innerHTML = `
      <div class="upload-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>${file.name}</span>
        <button onclick="event.stopPropagation();document.getElementById('file-input').click()">Đổi</button>
      </div>`;
    ua.style.cursor = 'default';

    // Show panels
    document.getElementById('credits-panel').style.display  = 'block';
    document.getElementById('list-controls').style.display  = 'flex';
    document.getElementById('welcome-state').style.display  = 'none';
    document.getElementById('timetable-state').style.display = 'flex';

    renderSubjectList();
    renderTimetable();

  } catch (err) {
    ua.innerHTML = `<div class="upload-error">❌ Lỗi: ${err.message}<br><small>Hãy thử lại.</small></div>`;
    ua.style.cursor = 'pointer';
    console.error(err);
  }
}

// ── Hex → rgba helper ─────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  // Upload area
  const ua        = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');

  ua.addEventListener('click', () => fileInput.click());

  ua.addEventListener('dragover', e => {
    e.preventDefault();
    ua.classList.add('dragover');
  });
  ua.addEventListener('dragleave', () => ua.classList.remove('dragover'));
  ua.addEventListener('drop', e => {
    e.preventDefault();
    ua.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) loadFile(f);
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) loadFile(e.target.files[0]);
  });

  // Week navigation
  document.getElementById('prev-week').addEventListener('click', () => {
    currentMonday.setDate(currentMonday.getDate() - 7);
    renderTimetable();
  });
  document.getElementById('next-week').addEventListener('click', () => {
    currentMonday.setDate(currentMonday.getDate() + 7);
    renderTimetable();
  });
  document.getElementById('btn-today').addEventListener('click', () => {
    if (!allMinDates.length) return;
    const minDate = new Date(Math.min(...allMinDates.map(d => d.getTime())));
    currentMonday = getMonday(minDate);
    renderTimetable();
  });

  // List actions
  document.getElementById('btn-select-all').addEventListener('click', () => {
    subjects.filter(s => s.hasSchedule).forEach(s => selectedSubjects.add(s.maMH));
    renderSubjectList();
    renderTimetable();
  });
  document.getElementById('btn-deselect-all').addEventListener('click', () => {
    selectedSubjects.clear();
    renderSubjectList();
    renderTimetable();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    selectedSubjects = new Set(
      subjects.filter(s => s.daHoc && s.hasSchedule).map(s => s.maMH)
    );
    renderSubjectList();
    renderTimetable();
  });

  // Keyboard week navigation
  document.addEventListener('keydown', e => {
    if (!currentMonday) return;
    if (e.key === 'ArrowLeft') {
      currentMonday.setDate(currentMonday.getDate() - 7);
      renderTimetable();
    } else if (e.key === 'ArrowRight') {
      currentMonday.setDate(currentMonday.getDate() + 7);
      renderTimetable();
    }
  });

  // Window resize: dynamic timetable height refit
  window.addEventListener('resize', () => {
    if (currentMonday) renderTimetable();
  });
}

// ── Sample Excel generator & loader ────────────────────────────
function getSampleRawData() {
  return [
    ["STT", "Mã môn học", "Tên môn học", "Mã LHP", "Loại LHP", "Số TC", "Bắt buộc", "Nhóm", "Giảng viên", "Lớp sinh viên", "Buổi học", "Đã học"],
    [1, "KTCH011", "Tư tưởng Hồ Chí Minh", "KTCH011.01", "Lý thuyết", 2, "x", "KTCH.CQ.T104", "Nguyễn Văn Linh", "D20AT01", "Thứ 2,từ 07:00 đến 09:30,Ph I4.111-I4.111,GV Nguyễn Văn Linh,17/08/26 đến 23/11/26", "x"],
    [2, "KTCH012", "Lịch sử Đảng Cộng sản Việt Nam", "KTCH012.01", "Lý thuyết", 2, "x", "KTCH.CQ.T104", "Phạm Hồng Kiên", "D20AT01", "Thứ 2,từ 13:00 đến 15:30,Ph F3.103-F3.103,GV Phạm Hồng Kiên,17/08/26 đến 23/11/26", "x"],
    [3, "LING005", "An toàn và bảo mật thông tin", "LING005.02", "Lý thuyết", 2, "", "CNTT.CQ.T102", "Nguyễn Thành Phương", "D20AT01", "Thứ 3,từ 13:00 đến 15:30,Ph F3.102-F3.102,GV Nguyễn Thành Phương,17/08/26 đến 23/11/26", "x"],
    [4, "KTPM034", "Kiến trúc và thiết kế phần mềm", "KTPM034.01", "Lý thuyết", 2, "", "CNTT.CQ.T104", "Nguyễn Xuân Cường", "D20AT01", "Thứ 4,từ 13:00 đến 15:30,Ph I3.206-I3.206,GV Nguyễn Xuân Cường,17/08/26 đến 23/11/26", "x"],
    [5, "LING260", "Thực hành An toàn và bảo mật thông tin", "LING260.01", "Thực hành", 1, "", "CNTT.CQ.T105", "Nguyễn Thành Phương", "D20AT01", "Thứ 5,từ 07:00 đến 12:15,Ph I2.303 (PM14)-I2.303 (PM14),GV Nguyễn Thành Phương,17/08/26 đến 23/11/26", "x"],
    [6, "LING210", "Quản lý dự án công nghệ thông tin", "LING210.01", "Lý thuyết", 3, "", "CNTT.CQ.T101", "Trần Bá Minh Sơn", "D20AT01", "Thứ 6,từ 13:00 đến 15:30,Ph I3.105-I3.105,GV Trần Bá Minh Sơn,17/08/26 đến 23/11/26", "x"],
    [7, "KTPM035", "Thực hành Kiến trúc và thiết kế phần mềm", "KTPM035.01", "Thực hành", 2, "", "CNTT.CQ.T105", "Nguyễn Xuân Cường", "D20AT01", "Thứ 7,từ 13:00 đến 15:30,Ph C.202 (PM06)-C.202 (PM06),GV Nguyễn Xuân Cường,17/08/26 đến 23/11/26", "x"],
    [8, "LTI0042", "Điện toán đám mây", "LTI0042.01", "Lý thuyết", 2, "x", "VCNS.CQ.T101", "Nguyễn Đình Thọ", "D20AT01", "Thứ 3,từ 09:45 đến 12:15,Ph I4.214,GV Nguyễn Đình Thọ,17/08/26 đến 23/11/26", ""],
    [9, "LTI0310", "Quản trị hệ thống", "LTI0310.01", "Lý thuyết", 2, "x", "VCNS.CQ.T102", "Lê Tú Minh Trí", "D20AT01", "Thứ 5,từ 13:00 đến 15:30,Ph A4.104,GV Lê Tú Minh Trí,17/08/26 đến 23/11/26", ""]
  ];
}

function downloadSampleExcel() {
  if (typeof XLSX === 'undefined') return alert('Thư viện SheetJS chưa sẵn sàng.');
  const raw = getSampleRawData();
  const ws = XLSX.utils.aoa_to_sheet(raw);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DSDKMH");
  XLSX.writeFile(wb, "DSDKMH_Mau.xlsx");
}

async function loadSampleData() {
  const rawRows = getSampleRawData();
  const result = [];
  for (let i = 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    const maMH = String(r[1]).trim();
    const tenMH = String(r[2]).trim();
    const soTC   = Number(r[5]);
    const batBuoc = String(r[6]).trim().toLowerCase() === 'x';
    const nhom   = String(r[7]).trim();
    const gv     = String(r[8]).trim();
    const lop    = String(r[9]).trim();
    const buoiHocRaw = String(r[10]).trim();
    const daHoc  = String(r[11]).trim().toLowerCase() === 'x';
    const sessions = parseBuoiHoc(buoiHocRaw);
    result.push({ maMH, tenMH, soTC, batBuoc, nhom, gv, lop, sessions, daHoc, hasSchedule: sessions.length > 0 });
  }

  subjects = result;
  subjects.forEach((s, i) => {
    colorMap[s.maMH] = PALETTE[i % PALETTE.length];
  });

  allMinDates = [];
  for (const s of subjects) {
    for (const sess of s.sessions) {
      allMinDates.push(sess.fromDate, sess.toDate);
    }
  }

  if (allMinDates.length) {
    const minDate = new Date(Math.min(...allMinDates.map(d => d.getTime())));
    currentMonday = getMonday(minDate);
  } else {
    currentMonday = getMonday(new Date());
  }

  selectedSubjects = new Set(
    subjects.filter(s => s.daHoc && s.hasSchedule).map(s => s.maMH)
  );

  const ua = document.getElementById('upload-area');
  ua.innerHTML = `
    <div class="upload-success">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>DSDKMH_Mau.xlsx</span>
      <button onclick="event.stopPropagation();document.getElementById('file-input').click()">Đổi</button>
    </div>`;

  document.getElementById('credits-panel').style.display = 'block';
  document.getElementById('list-controls').style.display = 'flex';
  document.getElementById('welcome-state').style.display = 'none';
  document.getElementById('timetable-state').style.display = 'flex';

  renderSubjectList();
  renderTimetable();
}

document.addEventListener('DOMContentLoaded', init);
