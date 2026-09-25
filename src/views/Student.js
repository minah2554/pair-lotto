/**
 * 학생 메인 화면
 * 프로토타입의 학생 뷰를 보존하면서 실제 API와 연결합니다.
 * - 히어로 카드 (학생 정보 + 응모 상태)
 * - 받은 PAIR 신청
 * - 나의 응모권 (과목별 PAIR)
 * - 새 PAIR 신청 폼
 * - PAIR MISSION
 * - 시험 결과 확인
 */
import { api } from '../services/index.js';
import { state, clearSession, notify } from '../state.js';
import { POLL_INTERVAL, TARGET_OPTIONS, BASE_RANGE, BONUS_PER_MISSION } from '../config.js';
import { el, showToast, showConfirm, resizeImage, formatDate } from '../utils/helpers.js';

let pollTimer = null;

/** 학생 화면 렌더링 */
export function renderStudent(container) {
  container.innerHTML = '';

  const shell = el('div', { className: 'app-shell' });
  shell.innerHTML = buildStudentHTML();
  container.appendChild(shell);

  // 데이터 로드
  loadStudentData();

  // Polling 시작
  startPolling();

  // 이벤트 연결
  attachStudentEvents(shell);
}

/** 학생 화면 정리 (Polling 중지) */
export function cleanupStudent() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** 학생 뷰 HTML 빌드 (프로토타입 구조 보존) */
function buildStudentHTML() {
  const student = state.student;
  const displayName = student ? `${student.studentNumber} ${student.studentName}` : '';

  return `
    <!-- 상단바 -->
    <header class="topbar">
      <div class="topbar-brand">
        <span class="logo-icon">🎰</span>
        <div>
          <div class="eyebrow">시험기간 협동 활동</div>
          <h1>PAIR LOTTO</h1>
        </div>
      </div>
      <div class="top-actions">
        <button id="refreshBtn" class="btn btn-ghost btn-mini">🔄 새로고침</button>
        <button id="logoutBtn" class="btn btn-ghost btn-mini">로그아웃</button>
      </div>
    </header>

    <!-- 히어로 카드 -->
    <div class="hero-card">
      <div>
        <p class="eyebrow">학생 화면</p>
        <h2>${displayName}</h2>
        <p class="sub">친구와 목표를 정하고, 미션으로 당첨 범위를 넓혀보세요.</p>
      </div>
      <div class="status-pill" id="globalStatusPill">로딩 중...</div>
    </div>

    <!-- 받은 PAIR 신청 -->
    <section class="card" id="receivedRequestsSection">
      <div class="card-head">
        <h3>🔔 받은 PAIR 신청</h3>
        <span class="badge badge-neutral" id="requestCount">0</span>
      </div>
      <div id="receivedRequestsList">
        <div class="empty-state">
          <p>받은 신청이 없습니다.</p>
        </div>
      </div>
    </section>

    <!-- 나의 응모권 -->
    <section class="card">
      <div class="card-head">
        <h3>🎟️ 나의 응모권</h3>
        <span class="badge badge-neutral">과목별 1페어</span>
      </div>
      <div id="myTickets">
        <div class="loading-spinner"><div class="spinner"></div><p>로딩 중...</p></div>
      </div>
    </section>

    <!-- 새 PAIR 신청 -->
    <section class="card" id="newRequestSection">
      <div class="card-head">
        <h3>➕ 새 PAIR 신청</h3>
        <span class="badge" id="applyStatusBadge">확인 중</span>
      </div>
      <div class="form-grid">
        <div class="form-grid form-grid-cols">
          <div class="form-group">
            <label class="form-label">과목</label>
            <select id="subjectSelect" class="form-select"></select>
          </div>
          <div class="form-group">
            <label class="form-label">친구</label>
            <select id="friendSelect" class="form-select"></select>
          </div>
          <div class="form-group">
            <label class="form-label">목표 합산점수</label>
            <select id="targetSelect" class="form-select">
              ${TARGET_OPTIONS.map(t => `<option value="${t}"${t === 180 ? ' selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <button id="sendRequest" class="btn btn-primary btn-wide">PAIR 신청 보내기</button>
        </div>
      </div>
      <p class="help">응모 OPEN 기간에는 신청 취소·재신청이 가능합니다.</p>
    </section>

    <!-- PAIR MISSION -->
    <section class="card" id="missionSection">
      <div class="card-head">
        <h3>⭐ PAIR MISSION</h3>
        <span class="badge badge-neutral" id="missionBadge">-</span>
      </div>
      <div id="missionContent">
        <div class="empty-state">
          <div class="icon">🤝</div>
          <p>PAIR가 성사되면 미션을 수행할 수 있어요!</p>
        </div>
      </div>
    </section>

    <!-- 시험 결과 -->
    <section class="card" id="resultSection">
      <div class="card-head">
        <h3>🏁 시험 후 결과 확인</h3>
        <span class="badge badge-neutral">결과 대기</span>
      </div>
      <div id="resultContent">
        <div class="empty-state">
          <div class="icon">🎯</div>
          <p>시험이 끝나고 선생님이 점수를 업로드하면 결과를 확인할 수 있어요.</p>
        </div>
      </div>
    </section>
  `;
}

/** 학생 데이터 로드 */
async function loadStudentData() {
  if (!state.student) return;

  try {
    const data = await api.getStudentHome(state.student.studentId);
    if (!data.ok) return;

    // 상태 업데이트
    state.subjects = data.subjects || [];
    state.students = data.students || [];
    state.applicationStatus = data.applicationStatus || { globalOpen: true, subjects: {} };
    state.receivedRequests = data.receivedRequests || [];
    state.sentRequests = data.sentRequests || [];
    state.myPairs = data.pairs || [];
    state.missionSubmissions = data.missionSubmissions || {};
    state.missions = data.missions || [];
    state.results = data.results || [];

    // UI 업데이트
    updateStudentUI();
  } catch (err) {
    console.error('학생 데이터 로드 실패:', err);
    showToast('데이터를 불러오지 못했습니다. 새로고침해주세요.', 'error');
  }
}

/** UI 업데이트 */
function updateStudentUI() {
  updateGlobalStatus();
  updateReceivedRequests();
  updateMyTickets();
  updateNewRequestForm();
  updateMissionSection();
  updateResultSection();
}

/** 응모 상태 업데이트 */
function updateGlobalStatus() {
  const pill = document.getElementById('globalStatusPill');
  if (!pill) return;
  const open = state.applicationStatus.globalOpen;
  pill.textContent = open ? '응모 OPEN' : '🔒 응모 마감';
  pill.className = `status-pill ${open ? 'badge-open open' : 'badge-closed closed'}`;
}

/** 받은 신청 목록 업데이트 */
function updateReceivedRequests() {
  const listEl = document.getElementById('receivedRequestsList');
  const countEl = document.getElementById('requestCount');
  if (!listEl || !countEl) return;

  const requests = state.receivedRequests;
  countEl.textContent = requests.length;
  countEl.className = `badge ${requests.length > 0 ? 'badge-warning' : 'badge-neutral'}`;

  if (requests.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>받은 신청이 없습니다.</p></div>';
    return;
  }

  listEl.innerHTML = '';
  requests.forEach(req => {
    const fromStudent = state.students.find(s => s.studentId === req.fromId);
    const subject = state.subjects.find(s => s.subjectId === req.subjectId);
    const card = el('div', { className: 'request-card' });
    card.innerHTML = `
      <div>
        <strong>${subject?.subjectName || req.subjectId} · ${fromStudent?.studentNumber || ''} ${fromStudent?.studentName || req.fromId}</strong>
        <p>TARGET <b>${req.target}</b>점으로 함께 응모했어요.</p>
      </div>
      <div class="row-actions">
        <button class="btn btn-primary accept-btn" data-id="${req.requestId}">수락</button>
        <button class="btn btn-danger reject-btn" data-id="${req.requestId}">거절</button>
      </div>
    `;
    listEl.appendChild(card);
  });

  // 수락/거절 이벤트
  listEl.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAccept(btn.dataset.id));
  });
  listEl.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => handleReject(btn.dataset.id));
  });
}

/** 나의 응모권 업데이트 */
function updateMyTickets() {
  const ticketsEl = document.getElementById('myTickets');
  if (!ticketsEl) return;

  const globalOpen = state.applicationStatus.globalOpen;

  // 과목별로 표시
  let html = '';
  state.subjects.forEach(subject => {
    const pair = state.myPairs.find(p => p.subjectId === subject.subjectId);
    const sentReq = state.sentRequests.find(r => r.subjectId === subject.subjectId && r.status === 'PENDING');

    if (pair) {
      // PAIR 성사됨
      const partnerA = state.students.find(s => s.studentId === pair.studentA);
      const partnerB = state.students.find(s => s.studentId === pair.studentB);
      const partner = pair.studentA === state.student.studentId ? partnerB : partnerA;
      const me = pair.studentA === state.student.studentId ? partnerA : partnerB;
      const submissions = state.missionSubmissions[pair.pairId] || [];
      const missionCount = submissions.length;
      const bonusRange = missionCount * BONUS_PER_MISSION;
      const totalRange = BASE_RANGE + bonusRange;
      const subjectOpen = state.applicationStatus.subjects[subject.subjectId] !== false;

      html += `
        <div class="ticket active pair-matched">
          <div class="ticket-top">
            <span>${subject.subjectName}</span>
            <span class="badge badge-open" style="padding:4px 10px;font-size:11px">PAIR 성사 ✓</span>
          </div>
          <div class="ticket-main">
            <div class="pair-name">${me?.studentName || ''} × ${partner?.studentName || ''}</div>
            <div class="target">TARGET <b>${pair.target}</b></div>
            <div class="range">당첨범위 ±${totalRange}점 (기본 ±${BASE_RANGE} + 미션보너스 ${bonusRange})</div>
          </div>
          <div class="ticket-foot">
            <span>미션 ${missionCount}/${state.missions.length} 완료</span>
            <span>${globalOpen && subjectOpen ? '응모 기간 중' : '🔒 응모 마감'}</span>
          </div>
        </div>
      `;
    } else if (sentReq) {
      // 신청 대기 중
      const toStudent = state.students.find(s => s.studentId === sentReq.toId);
      html += `
        <div class="ticket pending">
          <div class="ticket-top">
            <span>${subject.subjectName}</span>
            <span style="color:var(--warning)">응답 대기</span>
          </div>
          <div class="ticket-main">
            <div class="pair-name">${state.student.studentName} × ${toStudent?.studentName || sentReq.toId}</div>
            <div class="target">TARGET <b>${sentReq.target}</b></div>
            <div class="range">기본 당첨범위 ±${BASE_RANGE}</div>
          </div>
          <div class="ticket-foot">
            <span>상대방의 수락을 기다리는 중입니다.</span>
            <button class="btn btn-danger btn-mini cancel-request-btn" data-id="${sentReq.requestId}">신청 취소</button>
          </div>
        </div>
      `;
    } else {
      // 미응모
      html += `
        <div class="ticket" style="border-style:dotted;opacity:0.6">
          <div class="ticket-top">
            <span>${subject.subjectName}</span>
            <span style="color:var(--muted)">미응모</span>
          </div>
          <div class="ticket-main">
            <div style="color:var(--muted);font-size:14px">아직 응모하지 않았어요</div>
          </div>
        </div>
      `;
    }
  });

  ticketsEl.innerHTML = html || '<div class="empty-state"><p>과목 데이터를 불러오는 중...</p></div>';

  // 신청 취소 이벤트
  ticketsEl.querySelectorAll('.cancel-request-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCancelRequest(btn.dataset.id));
  });
}

/** 신청 폼 업데이트 */
function updateNewRequestForm() {
  const subjectSelect = document.getElementById('subjectSelect');
  const friendSelect = document.getElementById('friendSelect');
  const sendBtn = document.getElementById('sendRequest');
  const badge = document.getElementById('applyStatusBadge');
  if (!subjectSelect || !friendSelect) return;

  const globalOpen = state.applicationStatus.globalOpen;

  // 과목 목록
  subjectSelect.innerHTML = '';
  state.subjects.forEach(s => {
    const subOpen = state.applicationStatus.subjects[s.subjectId] !== false;
    const opt = document.createElement('option');
    opt.value = s.subjectId;
    opt.textContent = s.subjectName + (subOpen ? '' : ' (마감)');
    opt.disabled = !subOpen || !globalOpen;
    subjectSelect.appendChild(opt);
  });

  // 친구 목록 (자기 자신 제외)
  friendSelect.innerHTML = '';
  state.students.filter(s => s.studentId !== state.student?.studentId).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.studentId;
    opt.textContent = `${s.studentNumber} ${s.studentName}`;
    friendSelect.appendChild(opt);
  });

  // 신청 가능 여부
  const canApply = globalOpen;
  badge.textContent = canApply ? '신청 가능' : '신청 마감';
  badge.className = `badge ${canApply ? 'badge-open open' : 'badge-closed closed'}`;
  sendBtn.disabled = !canApply;
  sendBtn.style.opacity = canApply ? '1' : '0.45';

  // 마감 시 섹션 표시
  const section = document.getElementById('newRequestSection');
  if (section && !globalOpen) {
    section.querySelector('.help').textContent = '🔒 응모가 마감되었습니다. 새로운 신청을 할 수 없습니다.';
  }
}

/** PAIR MISSION 섹션 업데이트 */
function updateMissionSection() {
  const missionContent = document.getElementById('missionContent');
  const missionBadge = document.getElementById('missionBadge');
  if (!missionContent || !missionBadge) return;

  // 성사된 PAIR가 있는지 확인
  if (state.myPairs.length === 0) {
    missionBadge.textContent = '-';
    missionContent.innerHTML = `
      <div class="empty-state">
        <div class="icon">🤝</div>
        <p>PAIR가 성사되면 미션을 수행할 수 있어요!</p>
      </div>
    `;
    return;
  }

  // 첫 번째 PAIR 기준으로 미션 표시 (과목 선택 가능하도록 확장 가능)
  let html = '';

  state.myPairs.forEach(pair => {
    const subject = state.subjects.find(s => s.subjectId === pair.subjectId);
    const submissions = state.missionSubmissions[pair.pairId] || [];
    const completedMissions = submissions.map(s => s.missionId);
    const totalCompleted = completedMissions.length;

    html += `<div class="mb-2"><strong style="color:var(--accent-light)">${subject?.subjectName || pair.subjectId}</strong></div>`;
    html += '<div class="mission-list">';

    state.missions.forEach(mission => {
      const isDone = completedMissions.includes(mission.missionId);
      html += `
        <article class="mission ${isDone ? 'done' : ''}">
          <div>
            <strong>${mission.title}</strong>
            <p>${mission.description}</p>
          </div>
          ${isDone
            ? '<span class="btn btn-ghost btn-mini" style="pointer-events:none">✅ 인증 완료</span>'
            : `<label class="upload-btn">📷 사진 선택<input type="file" accept="image/*" class="mission-upload-input" data-pair="${pair.pairId}" data-subject="${pair.subjectId}" data-mission="${mission.missionId}" hidden /></label>`
          }
        </article>
      `;
    });

    html += '</div>';

    // 보너스 범위 표시
    const bonusRange = totalCompleted * BONUS_PER_MISSION;
    const totalRange = BASE_RANGE + bonusRange;
    html += `
      <div class="bonus-box mt-1">
        현재 BONUS RANGE <b>+${bonusRange}</b> → 당첨 범위 <b>±${totalRange}점</b>
      </div>
    `;
  });

  const totalMissions = state.missions.length;
  const totalDone = Object.values(state.missionSubmissions).flat().length;
  missionBadge.textContent = `${Math.min(totalDone, totalMissions)} / ${totalMissions} 완료`;
  missionContent.innerHTML = html;

  // 사진 업로드 이벤트
  missionContent.querySelectorAll('.mission-upload-input').forEach(input => {
    input.addEventListener('change', (e) => handleMissionUpload(e, input.dataset));
  });
}

/** 결과 섹션 업데이트 */
function updateResultSection() {
  const resultContent = document.getElementById('resultContent');
  if (!resultContent) return;

  if (!state.results || state.results.length === 0) {
    resultContent.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎯</div>
        <p>시험이 끝나고 선생님이 점수를 업로드하면 결과를 확인할 수 있어요.</p>
      </div>
    `;
    return;
  }

  let html = '';
  state.results.forEach(r => {
    const subject = state.subjects.find(s => s.subjectId === r.subjectId);
    const studentA = state.students.find(s => s.studentId === r.studentA);
    const studentB = state.students.find(s => s.studentId === r.studentB);
    const resultClass = r.result === 'JACKPOT' ? 'jackpot jackpot-glow' :
                        r.result === 'WIN' ? 'win' :
                        r.result === 'NEAR_MISS' ? 'near-miss' : 'miss';
    const resultText = r.result === 'JACKPOT' ? '🎊 JACKPOT!' :
                       r.result === 'WIN' ? '🎉 WIN!' :
                       r.result === 'NEAR_MISS' ? '😮 NEAR MISS' : '💫 MISS';

    html += `
      <div style="margin-bottom:8px"><strong style="color:var(--accent-light)">${subject?.subjectName || r.subjectId}</strong></div>
      <div class="result-card ${resultClass}">
        <div class="score-pair">
          <div>${studentA?.studentName || r.studentA} <b>${r.scoreA}</b></div>
          <div>${studentB?.studentName || r.studentB} <b>${r.scoreB}</b></div>
        </div>
        <div class="sum">합산 <b>${r.sum}</b></div>
        <div class="target-line">TARGET ${r.target} · 최종 당첨범위 ${r.rangeMin}~${r.rangeMax}</div>
        <div class="result-label ${r.result.toLowerCase()}">${resultText}</div>
      </div>
    `;
  });

  resultContent.innerHTML = html;
}

/** 이벤트 연결 */
function attachStudentEvents(shell) {
  shell.querySelector('#refreshBtn')?.addEventListener('click', () => {
    showToast('새로고침 중...', 'info');
    loadStudentData();
  });

  shell.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    const ok = await showConfirm('로그아웃하시겠습니까?');
    if (ok) {
      cleanupStudent();
      clearSession();
      state.currentView = 'login';
      notify();
    }
  });

  shell.querySelector('#sendRequest')?.addEventListener('click', handleSendRequest);
}

/** PAIR 신청 보내기 */
async function handleSendRequest() {
  const subjectId = document.getElementById('subjectSelect')?.value;
  const friendId = document.getElementById('friendSelect')?.value;
  const target = document.getElementById('targetSelect')?.value;

  if (!subjectId || !friendId || !target) {
    showToast('과목, 친구, 목표점수를 모두 선택해주세요.', 'error');
    return;
  }

  const friend = state.students.find(s => s.studentId === friendId);
  const subject = state.subjects.find(s => s.subjectId === subjectId);

  const ok = await showConfirm(
    `${subject?.subjectName} 과목에서 ${friend?.studentName || friendId}에게\nTARGET ${target}점으로 PAIR 신청을 보낼까요?`
  );
  if (!ok) return;

  const btn = document.getElementById('sendRequest');
  btn.disabled = true;
  btn.textContent = '신청 중...';

  try {
    await api.createPairRequest(state.student.studentId, friendId, subjectId, Number(target));
    showToast('PAIR 신청을 보냈습니다!', 'success');
    await loadStudentData();
  } catch (err) {
    showToast(err.message || '신청에 실패했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'PAIR 신청 보내기';
  }
}

/** PAIR 신청 수락 */
async function handleAccept(requestId) {
  const ok = await showConfirm('이 PAIR 신청을 수락하시겠습니까?');
  if (!ok) return;

  try {
    await api.acceptPairRequest(requestId, state.student.studentId);
    showToast('🎉 PAIR가 성사되었습니다!', 'success');
    await loadStudentData();
  } catch (err) {
    showToast(err.message || '수락에 실패했습니다.', 'error');
  }
}

/** PAIR 신청 거절 */
async function handleReject(requestId) {
  const ok = await showConfirm('이 신청을 거절하시겠습니까?');
  if (!ok) return;

  try {
    await api.rejectPairRequest(requestId, state.student.studentId);
    showToast('신청을 거절했습니다.', 'info');
    await loadStudentData();
  } catch (err) {
    showToast(err.message || '거절에 실패했습니다.', 'error');
  }
}

/** PAIR 신청 취소 */
async function handleCancelRequest(requestId) {
  const ok = await showConfirm('이 신청을 취소하시겠습니까?');
  if (!ok) return;

  try {
    await api.cancelPairRequest(requestId, state.student.studentId);
    showToast('신청을 취소했습니다.', 'info');
    await loadStudentData();
  } catch (err) {
    showToast(err.message || '취소에 실패했습니다.', 'error');
  }
}

/** 미션 사진 업로드 */
async function handleMissionUpload(e, dataset) {
  const file = e.target.files[0];
  if (!file) return;

  showToast('사진을 업로드하는 중...', 'info');

  try {
    const { base64, mimeType } = await resizeImage(file);
    const fileName = `${dataset.subject}_${state.student.studentNumber}_${dataset.mission}_${Date.now()}.jpg`;

    await api.submitMission(
      dataset.pair,
      dataset.subject,
      dataset.mission,
      state.student.studentId,
      base64,
      mimeType,
      fileName
    );

    showToast('✅ 미션 인증이 완료되었습니다!', 'success');
    await loadStudentData();
  } catch (err) {
    showToast(err.message || '업로드에 실패했습니다.', 'error');
  }
}

/** Polling 시작 */
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    loadStudentData();
  }, POLL_INTERVAL);
}
