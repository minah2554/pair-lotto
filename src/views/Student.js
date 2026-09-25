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
import { el, showToast, showConfirm, showAlertModal, getFooterHTML, resizeImage, formatDate } from '../utils/helpers.js';

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

/** 학생 뷰 HTML 빌드 (NEON ARCADE + LOTTO GAME) */
function buildStudentHTML() {
  const student = state.student;
  const displayName = student ? `${student.studentNumber} ${student.studentName}` : '';

  return `
    <!-- 상단바 -->
    <header class="topbar">
      <div class="topbar-brand">
        <span class="logo-icon">🎰</span>
        <div>
          <h1 style="font-family: 'Juache', sans-serif; font-size: 20px; line-height: 1.2;">PAIR LOTTO</h1>
          <div class="eyebrow" style="font-size: 10px; color: var(--neon-cyan); letter-spacing: 0.08em;">MATCH YOUR SCORE. WIN TOGETHER.</div>
        </div>
      </div>
      <div class="top-actions">
        <div class="player-tag">🎮 <b>${student?.studentNumber || ''}</b> ${student?.studentName || ''}</div>
        <button id="refreshBtn" class="btn btn-ghost btn-mini" title="새로고침">🔄</button>
        <button id="logoutBtn" class="btn btn-ghost btn-mini">로그아웃</button>
      </div>
    </header>

    <!-- 아케이드 HUD 요약 바 (게임 상태 헤드업 디스플레이) -->
    <div class="arcade-hud">
      <div class="hud-item hud-pair">
        <div class="hud-label">PAIR STATUS</div>
        <div class="hud-value highlight-cyan" id="hudPairStatus">확인 중</div>
      </div>
      <div class="hud-item hud-mission">
        <div class="hud-label">MISSION STATUS</div>
        <div class="hud-value highlight-gold" id="hudMissionStatus">- / 3 COMPLETE</div>
      </div>
      <div class="hud-item hud-result">
        <div class="hud-label">RESULT STATUS</div>
        <div class="hud-value highlight-green" id="hudResultStatus">대기 중</div>
      </div>
    </div>

    <!-- 받은 PAIR 신청 (INCOMING EVENT) -->
    <section class="card" id="receivedRequestsSection">
      <div class="card-head">
        <h3>⚡ INCOMING PAIR REQUESTS</h3>
        <span class="badge badge-warning" id="requestCount">0</span>
      </div>
      <div id="receivedRequestsList">
        <div class="empty-state">
          <p>도착한 매칭 신청이 없습니다.</p>
        </div>
      </div>
    </section>

    <!-- 디지털 LOTTO 티켓 (나의 응모권) -->
    <section class="card">
      <div class="card-head">
        <h3>🎟️ MY LOTTO TICKETS</h3>
        <span class="badge badge-neutral">1인당 최대 2개 페어 가능</span>
      </div>
      <div id="myTickets">
        <div class="loading-spinner"><div class="spinner"></div><p>로딩 중...</p></div>
      </div>
    </section>

    <!-- 새 PAIR 매칭 챌린지 (SELECT YOUR PAIR) -->
    <section class="card" id="newRequestSection">
      <div class="card-head">
        <h3>🎯 SELECT YOUR PAIR</h3>
        <span class="badge" id="applyStatusBadge">확인 중</span>
      </div>
      <div class="form-grid">
        <div class="form-grid form-grid-cols">
          <div class="form-group">
            <label class="form-label">CHALLENGE 과목</label>
            <select id="subjectSelect" class="form-select"></select>
          </div>
          <div class="form-group">
            <label class="form-label">PAIR PARTNER 친구</label>
            <select id="friendSelect" class="form-select"></select>
          </div>
          <div class="form-group">
            <label class="form-label">CHALLENGE TARGET 점수</label>
            <select id="targetSelect" class="form-select">
              ${TARGET_OPTIONS.map(t => `<option value="${t}"${t === 180 ? ' selected' : ''}>${t}점</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- 실시간 매칭 프리뷰 카드 -->
        <div class="match-preview-card">
          <div class="match-preview-tag">MATCH PREVIEW</div>
          <div class="match-vs-box">
            <div class="player-box me">
              <div class="role">PLAYER 1</div>
              <div class="pname">${displayName}</div>
            </div>
            <div class="match-vs-sign">×</div>
            <div class="player-box friend">
              <div class="role">PLAYER 2</div>
              <div class="pname" id="previewFriendName">파트너를 선택하세요</div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.1);">
            <span style="font-size:12px; color:var(--text-secondary);">선택된 과목: <b id="previewSubjectName" style="color:var(--neon-cyan);">-</b></span>
            <span style="font-size:12px; color:var(--gold); font-weight:800;">TARGET: <b id="previewTargetScore" style="font-size:16px;">180</b>점</span>
          </div>
        </div>

        <div>
          <button id="sendRequest" class="btn btn-primary btn-wide btn-lg" style="height:50px; font-weight:900; font-size:16px; letter-spacing:0.02em;">🚀 SEND PAIR REQUEST</button>
        </div>
      </div>
      <p class="help" id="newRequestHelp">신청 변경 기간 동안에는 자유롭게 신청 취소 및 페어 변경이 가능합니다.</p>
    </section>

    <!-- PAIR MISSION (QUEST BOARD) -->
    <section class="card" id="missionSection">
      <div class="card-head">
        <h3>⭐ QUEST BOARD · PAIR MISSION</h3>
        <span class="badge badge-neutral" id="missionBadge">-</span>
      </div>
      <div id="missionContent">
        <div class="empty-state">
          <div class="icon">🤝</div>
          <p>PAIR가 성사되면 미션을 수행하고 당첨 범위를 넓혀보세요!</p>
        </div>
      </div>
    </section>

    <!-- 시험 결과 확인 (LOTTO REVEAL) -->
    <section class="card" id="resultSection">
      <div class="card-head">
        <h3>🏁 LOTTO REVEAL · 시험 결과</h3>
        <span class="badge badge-neutral">결과 대기</span>
      </div>
      <div id="resultContent">
        <div class="empty-state">
          <div class="icon">🎯</div>
          <p>시험이 끝나고 선생님이 점수를 업로드하면 결과를 확인할 수 있어요.</p>
        </div>
      </div>
    </section>

    <!-- 웹앱 공통 푸터 -->
    ${getFooterHTML()}
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
  updateHUD();
  updateReceivedRequests();
  updateMyTickets();
  updateNewRequestForm();
  updateMissionSection();
  updateResultSection();
}

/** 아케이드 게임 HUD 상태 업데이트 */
function updateHUD() {
  const hudPair = document.getElementById('hudPairStatus');
  const hudMission = document.getElementById('hudMissionStatus');
  const hudResult = document.getElementById('hudResultStatus');
  if (!hudPair || !hudMission || !hudResult) return;

  // 1. PAIR STATUS
  const activePairs = state.myPairs.filter(p => p.status === 'ACTIVE');
  const pendingSent = state.sentRequests.find(r => r.status === 'PENDING');
  const pendingReceived = state.receivedRequests.length;

  if (activePairs.length >= 2) {
    hudPair.textContent = '2/2 MATCHED ✓';
    hudPair.className = 'hud-value highlight-cyan';
  } else if (activePairs.length === 1) {
    hudPair.textContent = '1/2 MATCHED';
    hudPair.className = 'hud-value highlight-cyan';
  } else if (pendingSent) {
    hudPair.textContent = 'WAITING ⏳';
    hudPair.className = 'hud-value highlight-gold';
  } else if (pendingReceived > 0) {
    hudPair.textContent = `REQUEST (${pendingReceived})`;
    hudPair.className = 'hud-value highlight-gold';
  } else {
    hudPair.textContent = 'READY (0/2)';
    hudPair.className = 'hud-value';
  }

  // 2. MISSION STATUS
  const activePairSubmissions = activePair ? (state.missionSubmissions[activePair.pairId] || []) : [];
  const completedCount = activePairSubmissions.length;
  const totalMissions = (state.missions && state.missions.length) || 3;
  const stars = '★'.repeat(completedCount) + '☆'.repeat(Math.max(0, totalMissions - completedCount));
  hudMission.textContent = `${stars} (${completedCount}/${totalMissions})`;

  // 3. RESULT STATUS
  if (state.results && state.results.length > 0) {
    hudResult.textContent = 'REVEALED 🏆';
    hudResult.className = 'hud-value highlight-green';
  } else {
    hudResult.textContent = '대기 중 🔒';
    hudResult.className = 'hud-value';
  }
}

/** 받은 신청 목록 (INCOMING PAIR REQUESTS) */
function updateReceivedRequests() {
  const listEl = document.getElementById('receivedRequestsList');
  const countEl = document.getElementById('requestCount');
  if (!listEl || !countEl) return;

  const requests = state.receivedRequests;
  countEl.textContent = requests.length;
  countEl.className = `badge ${requests.length > 0 ? 'badge-warning' : 'badge-neutral'}`;

  if (requests.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>도착한 매칭 신청이 없습니다.</p></div>';
    return;
  }

  listEl.innerHTML = '';
  requests.forEach(req => {
    const fromStudent = state.students.find(s => s.studentId === req.fromId);
    const subject = state.subjects.find(s => s.subjectId === req.subjectId);
    const card = el('div', { className: 'incoming-event-card' });
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge" style="background:rgba(179,71,255,0.2); color:var(--neon-purple); border:1px solid rgba(179,71,255,0.4); font-size:11px;">CHALLENGE REQUEST</span>
            <span style="font-size:13px; color:var(--neon-cyan); font-weight:700;">[ ${subject?.subjectName || req.subjectId} ]</span>
          </div>
          <div style="margin:8px 0 4px; font-size:16px; font-weight:800; color:var(--text);">
            <span style="color:var(--gold);">${fromStudent?.studentNumber || ''} ${fromStudent?.studentName || req.fromId}</span>님이 PAIR 매칭을 요청했습니다!
          </div>
          <div style="font-size:13px; color:var(--text-secondary);">
            목표 합산점수: <b style="color:var(--gold); font-family:'BcCardFont'; font-size:16px;">TARGET ${req.target}점</b>
          </div>
        </div>
        <div class="row-actions" style="gap:10px;">
          <button class="btn btn-success accept-btn" data-id="${req.requestId}" style="padding:10px 22px; font-weight:800; font-size:14px; box-shadow:0 0 16px rgba(0,255,136,0.35);">✅ 수락</button>
          <button class="btn btn-danger reject-btn" data-id="${req.requestId}" style="padding:10px 18px; font-size:13px;">거절</button>
        </div>
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

/** 나의 응모권 (MY LOTTO TICKETS) 업데이트 */
function updateMyTickets() {
  const ticketsEl = document.getElementById('myTickets');
  if (!ticketsEl) return;

  const globalOpen = state.applicationStatus.globalOpen;

  // 과목별로 표시
  let html = '';
  state.subjects.forEach(subject => {
    const pair = state.myPairs.find(p => p.subjectId === subject.subjectId && p.status === 'ACTIVE');
    const sentReq = state.sentRequests.find(r => r.subjectId === subject.subjectId && r.status === 'PENDING');
    const subjectOpen = state.applicationStatus.subjects[subject.subjectId] !== false;
    const canModify = globalOpen && subjectOpen;

    if (pair) {
      // PAIR 성사됨 (디지털 LOTTO 티켓)
      const partnerA = state.students.find(s => s.studentId === pair.studentA);
      const partnerB = state.students.find(s => s.studentId === pair.studentB);
      const partner = pair.studentA === state.student.studentId ? partnerB : partnerA;
      const me = pair.studentA === state.student.studentId ? partnerA : partnerB;
      const submissions = state.missionSubmissions[pair.pairId] || [];
      const missionCount = submissions.length;
      const bonusRange = missionCount * BONUS_PER_MISSION;
      const totalRange = BASE_RANGE + bonusRange;
      const stars = '★'.repeat(missionCount) + '☆'.repeat(Math.max(0, 3 - missionCount));

      html += `
        <div class="ticket arcade-ticket active pair-matched">
          <div class="ticket-top">
            <span class="badge" style="background:rgba(0,240,255,0.12); color:var(--neon-cyan); border:1px solid rgba(0,240,255,0.3); font-weight:800; font-size:12px;">[ 🧪 ${subject.subjectName} ]</span>
            <span class="badge badge-open" style="padding:4px 12px; font-size:11px; font-weight:800; box-shadow:0 0 10px rgba(0,255,136,0.3);">PAIR MATCHED ✓</span>
          </div>

          <div class="ticket-main">
            <!-- PAIR 이름 -->
            <div class="pair-name" style="font-size:18px; color:var(--text); letter-spacing:-0.01em; margin-bottom:8px;">
              ${me?.studentNumber || ''} ${me?.studentName || ''} <span style="color:var(--gold); font-weight:900; margin:0 6px;">×</span> ${partner?.studentNumber || ''} ${partner?.studentName || ''}
            </div>

            <!-- TARGET 슬롯머신 점수판 (가장 크게 강조) -->
            <div class="arcade-target-banner">
              <div class="arcade-target-label">CHALLENGE TARGET</div>
              <div class="arcade-target-number">${pair.target}</div>
              <div class="arcade-buff-badge">🔥 BONUS ACTIVE (±${totalRange}점)</div>
            </div>

            <div class="range" style="color:var(--text-secondary); font-size:13px; margin-top:8px;">
              기본 당첨범위 ±${BASE_RANGE}점 + 미션 보너스 +${bonusRange}점 → 최종 <b>±${totalRange}점</b>
            </div>
          </div>

          <div class="ticket-foot" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div style="font-size:13px; color:var(--text-secondary);">
              MISSION: <span style="color:var(--gold); font-weight:800;">${stars} (${missionCount}/3)</span>
            </div>
            ${canModify
              ? `<button class="btn btn-danger btn-mini break-pair-btn" data-id="${pair.pairId}" title="신청 변경 기간 동안 페어를 해제할 수 있습니다.">💔 페어 끊기</button>`
              : `<span class="badge badge-closed" style="font-size:11px; padding:4px 10px;">🔒 응모 마감 (수정 불가)</span>`
            }
          </div>
          ${canModify
            ? `<div style="font-size:11px; color:var(--muted); margin-top:8px; text-align:right;">* 신청 변경 기간 동안에는 자유롭게 페어를 끊고 새로운 친구와 변경할 수 있습니다.</div>`
            : `<div style="font-size:11px; color:var(--danger); margin-top:8px; text-align:right;">* 응모가 마감되어 더 이상 페어를 수정할 수 없습니다.</div>`
          }
        </div>
      `;
    } else if (sentReq) {
      // 신청 대기 중
      const toStudent = state.students.find(s => s.studentId === sentReq.toId);
      html += `
        <div class="ticket arcade-ticket pending">
          <div class="ticket-top">
            <span class="badge" style="background:rgba(245,158,11,0.12); color:var(--warning); border:1px solid rgba(245,158,11,0.3); font-weight:800; font-size:12px;">[ 🧪 ${subject.subjectName} ]</span>
            <span class="badge badge-warning" style="font-size:11px;">⏳ 응답 대기 중</span>
          </div>
          <div class="ticket-main">
            <div class="pair-name" style="font-size:16px;">
              ${state.student.studentName} <span style="color:var(--warning);">×</span> ${toStudent?.studentName || sentReq.toId}
            </div>
            <div class="arcade-target-banner" style="padding:12px; margin:12px 0;">
              <div class="arcade-target-label">REQUESTED TARGET</div>
              <div class="arcade-target-number" style="font-size:36px; opacity:0.85;">${sentReq.target}</div>
            </div>
            <div class="range">기본 당첨범위 ±${BASE_RANGE}점</div>
          </div>
          <div class="ticket-foot" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:var(--muted);">상대방의 수락을 기다리는 중...</span>
            <button class="btn btn-danger btn-mini cancel-request-btn" data-id="${sentReq.requestId}">신청 취소</button>
          </div>
        </div>
      `;
    } else {
      // 미응모 상태 카드
      html += `
        <div class="ticket arcade-ticket" style="border-style:dashed !important; opacity:0.65;">
          <div class="ticket-top">
            <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px;">[ ${subject.subjectName} ]</span>
            <span class="badge badge-neutral" style="font-size:11px;">미응모</span>
          </div>
          <div class="ticket-main" style="padding:16px 0;">
            <div style="font-size:14px; color:var(--text-secondary); margin-bottom:4px;">아직 매칭되지 않았습니다.</div>
            <div style="font-size:12px; color:var(--muted);">아래 [SELECT YOUR PAIR]에서 친구를 찾아보세요!</div>
          </div>
        </div>
      `;
    }
  });

  ticketsEl.innerHTML = html || '<div class="empty-state"><p>과목 데이터를 불러오는 중...</p></div>';

  // 페어 끊기 이벤트
  ticketsEl.querySelectorAll('.break-pair-btn').forEach(btn => {
    btn.addEventListener('click', () => handleBreakPair(btn.dataset.id));
  });

  // 신청 취소 이벤트
  ticketsEl.querySelectorAll('.cancel-request-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCancelRequest(btn.dataset.id));
  });
}

/** 새 PAIR 매칭 폼 (SELECT YOUR PAIR) 업데이트 */
function updateNewRequestForm() {
  const subjectSelect = document.getElementById('subjectSelect');
  const friendSelect = document.getElementById('friendSelect');
  const targetSelect = document.getElementById('targetSelect');
  const sendBtn = document.getElementById('sendRequest');
  const badge = document.getElementById('applyStatusBadge');
  const helpText = document.getElementById('newRequestHelp');
  if (!subjectSelect || !friendSelect || !targetSelect) return;

  const globalOpen = state.applicationStatus.globalOpen;
  const hasActivePair = state.myPairs.some(p => p.status === 'ACTIVE');

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
  friendSelect.innerHTML = '<option value="">-- 친구 선택 --</option>';
  state.students.filter(s => s.studentId !== state.student?.studentId).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.studentId;
    opt.textContent = `${s.studentNumber} ${s.studentName}`;
    friendSelect.appendChild(opt);
  });

  // 매칭 프리뷰 실시간 동기화
  const syncPreview = () => {
    const previewSubject = document.getElementById('previewSubjectName');
    const previewFriend = document.getElementById('previewFriendName');
    const previewTarget = document.getElementById('previewTargetScore');

    const selectedSub = state.subjects.find(s => s.subjectId === subjectSelect.value);
    const selectedFriend = state.students.find(s => s.studentId === friendSelect.value);

    if (previewSubject) previewSubject.textContent = selectedSub ? selectedSub.subjectName : '-';
    if (previewFriend) previewFriend.textContent = selectedFriend ? `${selectedFriend.studentNumber} ${selectedFriend.studentName}` : '파트너를 선택하세요';
    if (previewTarget) previewTarget.textContent = targetSelect.value || '180';
  };

  subjectSelect.onchange = syncPreview;
  friendSelect.onchange = syncPreview;
  targetSelect.onchange = syncPreview;
  syncPreview();

  // 1인당 최대 2개 페어 및 신청 가능 여부
  const activePairsCount = state.myPairs.filter(p => p.status === 'ACTIVE').length;

  if (!globalOpen) {
    badge.textContent = 'APPLICATION CLOSED';
    badge.className = 'badge badge-closed closed';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.45';
    if (helpText) helpText.innerHTML = '<span style="color:var(--danger); font-weight:700;">🔒 응모가 마감되어 새로운 신청이나 수정을 할 수 없습니다.</span>';
  } else if (activePairsCount >= 2) {
    badge.textContent = '페어 정원 완료 (2/2)';
    badge.className = 'badge badge-open open';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.55';
    if (helpText) helpText.innerHTML = '<span style="color:var(--warning); font-weight:700;">⚠️ 이미 최대 페어(2개)가 모두 완료되었습니다. 다른 친구와 페어하려면 위 티켓에서 [💔 페어 끊기]를 먼저 진행해주세요.</span>';
  } else if (activePairsCount === 1) {
    badge.textContent = '1개 페어 완료 (추가 1개 가능)';
    badge.className = 'badge badge-open open';
    sendBtn.disabled = false;
    sendBtn.style.opacity = '1';
    if (helpText) helpText.innerHTML = '<span style="color:var(--neon-cyan); font-weight:700;">✨ 현재 1개 페어가 성사되었습니다. 홀수 인원 대비 추가로 1명 더 페어 신청이 가능합니다!</span>';
  } else {
    badge.textContent = 'APPLICATION OPEN (최대 2페어)';
    badge.className = 'badge badge-open open';
    sendBtn.disabled = false;
    sendBtn.style.opacity = '1';
    if (helpText) helpText.textContent = '1인당 최대 2개 페어까지 신청/수락 가능합니다. (홀수 인원 시 2개 페어 참여 가능)';
  }
}

/** PAIR MISSION 섹션 (QUEST BOARD) 업데이트 */
function updateMissionSection() {
  const missionContent = document.getElementById('missionContent');
  const missionBadge = document.getElementById('missionBadge');
  if (!missionContent || !missionBadge) return;

  // 성사된 PAIR가 있는지 확인
  const activePairs = state.myPairs.filter(p => p.status === 'ACTIVE');
  if (activePairs.length === 0) {
    missionBadge.textContent = 'LOCKED';
    missionBadge.className = 'badge badge-neutral';
    missionContent.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔒</div>
        <p>PAIR 매칭이 완료되면 퀘스트가 해금됩니다!</p>
      </div>
    `;
    return;
  }

  let html = '';
  activePairs.forEach(pair => {
    const subject = state.subjects.find(s => s.subjectId === pair.subjectId);
    const submissions = state.missionSubmissions[pair.pairId] || [];
    const completedMissions = submissions.map(s => s.missionId);
    const totalCompleted = completedMissions.length;

    html += `
      <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
        <span class="badge" style="background:rgba(0,240,255,0.15); color:var(--neon-cyan); font-weight:800; border:1px solid rgba(0,240,255,0.3);">
          [ 🧪 ${subject?.subjectName || pair.subjectId} QUEST ]
        </span>
      </div>
    `;
    html += '<div class="quest-board">';

    state.missions.forEach(mission => {
      const isDone = completedMissions.includes(mission.missionId);
      html += `
        <article class="quest-card ${isDone ? 'completed' : ''}">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="badge ${isDone ? 'badge-open' : 'badge-neutral'}" style="font-size:11px; padding:3px 8px;">
                ${isDone ? 'COMPLETED ★★★' : 'READY'}
              </span>
              <strong class="quest-title">${mission.title}</strong>
            </div>
            <p class="quest-desc">${mission.description}</p>
          </div>
          <div style="flex-shrink:0;">
            ${isDone
              ? '<span class="badge badge-open" style="padding:8px 14px; font-weight:800; font-size:13px; box-shadow:0 0 10px rgba(0,255,136,0.3);">✅ 완료</span>'
              : `<label class="btn-arcade-upload">📷 PHOTO VERIFY<input type="file" accept="image/*" class="mission-upload-input" data-pair="${pair.pairId}" data-subject="${pair.subjectId}" data-mission="${mission.missionId}" hidden /></label>`
            }
          </div>
        </article>
      `;
    });

    html += '</div>';

    // 보너스 버프 프로그레스 바
    const bonusRange = totalCompleted * BONUS_PER_MISSION;
    const totalRange = BASE_RANGE + bonusRange;
    html += `
      <div class="arcade-target-banner mt-2" style="background:rgba(255,209,102,0.06); border:1px solid rgba(255,209,102,0.3); padding:16px;">
        <div style="font-size:11px; color:var(--gold); font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">🔥 BUFF PROGRESS & BONUS RANGE</div>
        <div style="font-size:15px; color:var(--text); margin-top:6px;">
          BASE RANGE <b>±${BASE_RANGE}</b> + MISSION BONUS <b style="color:var(--gold);">+${bonusRange}</b> → FINAL RANGE <b style="color:var(--neon-cyan); font-family:'BcCardFont'; font-size:22px;">±${totalRange}점</b>
        </div>
      </div>
    `;
  });

  const totalMissions = state.missions.length;
  const totalDone = Object.values(state.missionSubmissions).flat().length;
  missionBadge.textContent = `${Math.min(totalDone, totalMissions)} / ${totalMissions} COMPLETED`;
  missionBadge.className = 'badge badge-open';
  missionContent.innerHTML = html;

  // 사진 업로드 이벤트
  missionContent.querySelectorAll('.mission-upload-input').forEach(input => {
    input.addEventListener('change', (e) => handleMissionUpload(e, input.dataset));
  });
}

/** 결과 섹션 (LOTTO REVEAL) 업데이트 */
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
  state.results.forEach((r, idx) => {
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
      <div style="margin-bottom:8px">
        <span class="badge" style="background:rgba(0,240,255,0.15); color:var(--neon-cyan); font-weight:800; border:1px solid rgba(0,240,255,0.3);">
          [ 🏁 ${subject?.subjectName || r.subjectId} LOTTO REVEAL ]
        </span>
      </div>

      <div class="result-card ${resultClass}" id="resultBox-${idx}">
        <div class="result-unrevealed" id="unrevealed-${idx}">
          <p style="color:var(--text-secondary); margin-bottom:14px; font-size:14px;">결과 발표가 준비되었습니다!</p>
          <button class="btn btn-gold btn-lg reveal-btn" data-idx="${idx}" style="font-weight:900; font-size:16px; padding:14px 28px; box-shadow:0 0 24px rgba(255,209,102,0.5);">
            🎰 CHECK RESULT (결과 확인)
          </button>
        </div>

        <div class="result-revealed hidden" id="revealed-${idx}">
          <div class="score-pair">
            <div>${studentA?.studentName || r.studentA} <b class="score-a">${r.scoreA}</b></div>
            <div style="font-size:24px; font-weight:900; color:var(--gold); align-self:center;">+</div>
            <div>${studentB?.studentName || r.studentB} <b class="score-b">${r.scoreB}</b></div>
          </div>
          <div class="sum" style="font-family:'BcCardFont'; font-size:40px; color:var(--neon-cyan); text-shadow:0 0 16px rgba(0,240,255,0.4);">
            TOTAL <span class="total-score">${r.sum}</span>점
          </div>
          <div class="target-line" style="font-size:14px; margin-top:4px;">
            TARGET <b style="color:var(--gold); font-size:16px;">${r.target}</b>점 · 최종 당첨범위 ${r.rangeMin}~${r.rangeMax}점
          </div>
          <div class="result-label ${r.result.toLowerCase()}" style="font-size:32px; font-family:'BcCardFont'; margin-top:16px;">
            ${resultText}
          </div>
        </div>
      </div>
    `;
  });

  resultContent.innerHTML = html;

  // 결과 공개 롤링 애니메이션 버튼 이벤트
  resultContent.querySelectorAll('.reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.idx;
      const unrevealed = document.getElementById(`unrevealed-${idx}`);
      const revealed = document.getElementById(`revealed-${idx}`);
      if (!unrevealed || !revealed) return;

      btn.disabled = true;
      btn.textContent = '🎰 ROLLING...';

      setTimeout(() => {
        unrevealed.classList.add('hidden');
        revealed.classList.remove('hidden');
      }, 1000);
    });
  });
}

/** PAIR MATCH 성사 축하 애니메이션 오버레이 */
function showPairMatchAnimation(partnerName, subjectName, target) {
  const overlay = el('div', { className: 'pair-match-overlay' });
  overlay.innerHTML = `
    <div class="pair-match-content">
      <div style="font-size:48px; margin-bottom:8px;">🏆</div>
      <h2 class="pair-match-title">PAIR MATCH!</h2>
      <div class="pair-match-players">${state.student?.studentName || '나'} × ${partnerName}</div>
      <div style="font-size:14px; color:var(--neon-cyan); font-weight:700; margin-bottom:12px;">[ ${subjectName} ]</div>
      <div class="pair-match-target">TARGET ${target}점</div>
      <div style="margin-top:16px; font-size:12px; color:var(--text-secondary);">성공적으로 매칭되었습니다! ✨</div>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.1)';
    setTimeout(() => overlay.remove(), 400);
  }, 1600);
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

  // 최대 2개 페어 제한
  const activePairsCount = state.myPairs.filter(p => p.status === 'ACTIVE').length;
  if (activePairsCount >= 2) {
    await showAlertModal('이미 최대 페어(2개)를 모두 완료했습니다.\n다른 친구와 페어하려면 먼저 위의 [나의 응모권]에서 기존 페어를 [페어 끊기] 해주세요.', '페어 신청 불가');
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
    const errorMsg = err.message || '신청에 실패했습니다.';
    if (errorMsg.includes('이미 페어가 완료되었습니다')) {
      await showAlertModal('이미 페어가 완료되었습니다.', '신청 불가');
    } else {
      await showAlertModal(errorMsg, '신청 안내');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'PAIR 신청 보내기';
  }
}

/** PAIR 신청 수락 */
async function handleAccept(requestId) {
  // 1인 1페어 원칙: 본인이 이미 활성 페어가 있는 경우 차단
  const hasActivePair = state.myPairs.some(p => p.status === 'ACTIVE');
  if (hasActivePair) {
    await showAlertModal('이미 페어가 완료되었습니다.\n1인당 1번만 페어가 가능하므로, 기존 페어를 끊기 전에는 다른 신청을 수락할 수 없습니다.', '수락 불가');
    return;
  }

  const ok = await showConfirm('이 PAIR 신청을 수락하시겠습니까?\n수락 시 1인 1페어 원칙에 따라 정식 페어가 성사됩니다.');
  if (!ok) return;

  const req = state.receivedRequests.find(r => r.requestId === requestId);
  const fromStudent = state.students.find(s => s.studentId === req?.fromId);
  const subject = state.subjects.find(s => s.subjectId === req?.subjectId);

  try {
    await api.acceptPairRequest(requestId, state.student.studentId);
    showToast('🎉 PAIR가 성사되었습니다!', 'success');
    showPairMatchAnimation(fromStudent?.studentName || '파트너', subject?.subjectName || '', req?.target || '');
    await loadStudentData();
  } catch (err) {
    const errorMsg = err.message || '수락에 실패했습니다.';
    if (errorMsg.includes('이미 페어가 완료되었습니다')) {
      await showAlertModal('이미 페어가 완료되었습니다.', '페어 완료 안내');
    } else {
      await showAlertModal(errorMsg, '수락 불가');
    }
    await loadStudentData();
  }
}

/** 성사된 페어 끊기 (신청 변경 기간 동안 자유롭게 수정 가능) */
async function handleBreakPair(pairId) {
  const globalOpen = state.applicationStatus.globalOpen;
  if (!globalOpen) {
    await showAlertModal('신청 변경 기간이 마감되어 더 이상 페어를 수정할 수 없습니다.', '수정 불가 안내');
    return;
  }

  const ok = await showConfirm(
    '정말로 이 친구와의 페어를 끊으시겠습니까?\n\n* 신청 변경 기간 동안에는 자유롭게 페어를 끊고 새로운 친구와 다시 페어할 수 있습니다.'
  );
  if (!ok) return;

  try {
    await api.cancelPair(pairId, state.student.studentId);
    showToast('페어가 성공적으로 해제되었습니다. 새로운 친구와 페어할 수 있습니다.', 'success');
    await loadStudentData();
  } catch (err) {
    await showAlertModal(err.message || '페어 해제에 실패했습니다.', '오류');
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
