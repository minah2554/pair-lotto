/**
 * 관리자 대시보드 화면
 * 프로토타입의 교사 뷰를 보존하면서 전체 관리 기능을 구현합니다.
 * 메뉴: 대시보드, 학생관리, 과목관리, 응모관리, PAIR현황, 미션인증, 시험점수, 당첨결과, 설정
 */
import { api } from '../services/index.js';
import { state, clearAdminSession, notify } from '../state.js';
import { TARGET_OPTIONS, BASE_RANGE, BONUS_PER_MISSION, NEAR_MISS_RANGE } from '../config.js';
import { el, showToast, showConfirm, parseCSV, getFooterHTML, formatDate } from '../utils/helpers.js';

let currentTab = 'dashboard';

export function renderAdmin(container) {
  container.innerHTML = '';

  const shell = el('div', { className: 'app-shell' });
  shell.innerHTML = buildAdminShell();
  container.appendChild(shell);

  loadAdminData();
  attachAdminEvents(shell);
}

function buildAdminShell() {
  return `
    <header class="topbar">
      <div class="topbar-brand">
        <span class="logo-icon"><img src="/logo-lotto.svg" alt="PAIR LOTTO 로고" style="width: 28px; height: 28px; object-fit: contain;" /></span>
        <div>
          <div class="eyebrow">관리자 모드</div>
          <h1>PAIR LOTTO</h1>
        </div>
      </div>
      <div class="top-actions">
        <button id="adminRefreshBtn" class="btn btn-ghost btn-mini">🔄 새로고침</button>
        <button id="adminLogoutBtn" class="btn btn-ghost btn-mini">로그아웃</button>
      </div>
    </header>

    <!-- 관리자 메뉴 -->
    <div class="admin-menu" id="adminMenu">
      <div class="admin-menu-item active" data-tab="dashboard"><span class="icon">📊</span>대시보드</div>
      <div class="admin-menu-item" data-tab="students"><span class="icon">👥</span>학생 관리</div>
      <div class="admin-menu-item" data-tab="subjects"><span class="icon">📚</span>과목 관리</div>
      <div class="admin-menu-item" data-tab="application"><span class="icon">🔒</span>응모 관리</div>
      <div class="admin-menu-item" data-tab="pairs"><span class="icon">🤝</span>PAIR 현황</div>
      <div class="admin-menu-item" data-tab="missions"><span class="icon">📷</span>미션 인증</div>
      <div class="admin-menu-item" data-tab="scores"><span class="icon">📝</span>시험 점수</div>
      <div class="admin-menu-item" data-tab="results"><span class="icon">🏆</span>당첨 결과</div>
      <div class="admin-menu-item" data-tab="settings"><span class="icon">⚙️</span>설정</div>
    </div>

    <!-- 탭 콘텐츠 -->
    <div id="adminContent">
      <div class="loading-spinner"><div class="spinner"></div><p>로딩 중...</p></div>
    </div>

    <!-- 웹앱 공통 푸터 -->
    ${getFooterHTML()}
  `;
}

/** 관리자 데이터 로드 */
async function loadAdminData() {
  try {
    const [studentsRes, subjectsRes, statusRes, statsRes, pairsRes, requestsRes, missionsRes, submissionsRes] =
      await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getApplicationStatus(),
        api.getDashboardStats(),
        api.getAllPairs(),
        api.getAllRequests(),
        api.getMissions(),
        api.getAllMissionSubmissions(),
      ]);

    state.students = studentsRes.students || [];
    state.subjects = subjectsRes.subjects || [];
    state.applicationStatus = statusRes || { globalOpen: true, subjects: {} };
    state.dashboard = statsRes.stats || {};
    state.myPairs = pairsRes.pairs || [];
    state.receivedRequests = requestsRes.requests || [];
    state.missions = missionsRes.missions || [];
    state.missionSubmissions = submissionsRes.submissions || [];

    renderTab(currentTab);
  } catch (err) {
    console.error('관리자 데이터 로드 실패:', err);
    showToast('데이터를 불러오지 못했습니다.', 'error');
  }
}

/** 이벤트 연결 */
function attachAdminEvents(shell) {
  shell.querySelector('#adminRefreshBtn')?.addEventListener('click', () => {
    showToast('새로고침 중...', 'info');
    loadAdminData();
  });

  shell.querySelector('#adminLogoutBtn')?.addEventListener('click', async () => {
    const ok = await showConfirm('관리자 모드를 종료하시겠습니까?');
    if (ok) {
      clearAdminSession();
      state.currentView = 'login';
      notify();
    }
  });

  shell.querySelector('#adminMenu')?.addEventListener('click', (e) => {
    const item = e.target.closest('.admin-menu-item');
    if (!item) return;
    currentTab = item.dataset.tab;
    shell.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    renderTab(currentTab);
  });
}

/** 탭 콘텐츠 렌더링 */
function renderTab(tab) {
  const content = document.getElementById('adminContent');
  if (!content) return;

  switch (tab) {
    case 'dashboard': renderDashboard(content); break;
    case 'students': renderStudentsTab(content); break;
    case 'subjects': renderSubjectsTab(content); break;
    case 'application': renderApplicationTab(content); break;
    case 'pairs': renderPairsTab(content); break;
    case 'missions': renderMissionsTab(content); break;
    case 'scores': renderScoresTab(content); break;
    case 'results': renderResultsTab(content); break;
    case 'settings': renderSettingsTab(content); break;
  }
}

// ==================== 대시보드 ====================
function renderDashboard(content) {
  const stats = state.dashboard || {};
  content.innerHTML = `
    <div class="hero-card teacher">
      <div>
        <p class="eyebrow">관리자 모드</p>
        <h2>PAIR LOTTO 운영 대시보드</h2>
        <p class="sub">응모 상태, 미션 인증, 시험 결과와 당첨 현황을 한 번에 관리합니다.</p>
      </div>
      <button id="toggleLockBtn" class="btn ${state.applicationStatus.globalOpen ? 'btn-danger' : 'btn-success'} btn-lg">
        ${state.applicationStatus.globalOpen ? '🔒 전체 응모 마감' : '🔓 전체 응모 다시 열기'}
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat"><span>전체 학생</span><b class="sum-num">${stats.totalStudents || 0}</b><span class="unit">명</span></div>
      <div class="stat"><span>성사 PAIR</span><b class="sum-num">${stats.activePairs || 0}</b><span class="unit">팀</span></div>
      <div class="stat"><span>대기 신청</span><b class="sum-num">${stats.pendingRequests || 0}</b><span class="unit">건</span></div>
      <div class="stat"><span>미션 완료</span><b class="sum-num">${stats.completedMissions || 0}</b><span class="unit">건</span></div>
      <div class="stat"><span>미응모 학생</span><b class="sum-num">${stats.studentsWithoutPairs || 0}</b><span class="unit">명</span></div>
      <div class="stat"><span>점수 업로드</span><b class="sum-num" style="font-size:26px">${stats.resultsUploaded ? '완료' : '대기'}</b></div>
      <div class="stat"><span>당첨 PAIR</span><b class="sum-num">${stats.winCount || 0}</b><span class="unit">팀</span></div>
      <div class="stat"><span>현재 상태</span><b class="sum-num" style="font-size:26px;color:${state.applicationStatus.globalOpen ? 'var(--good)' : 'var(--danger)'}">${state.applicationStatus.globalOpen ? 'OPEN' : 'CLOSE'}</b></div>
    </div>
  `;

  content.querySelector('#toggleLockBtn')?.addEventListener('click', async () => {
    const newOpen = !state.applicationStatus.globalOpen;
    const msg = newOpen ? '전체 응모를 다시 열겠습니까?' : '전체 응모를 마감하시겠습니까?\n모든 과목의 신청이 마감됩니다.';
    const ok = await showConfirm(msg);
    if (!ok) return;

    try {
      await api.setGlobalApplicationStatus(newOpen);
      showToast(newOpen ? '응모가 열렸습니다.' : '응모가 마감되었습니다.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==================== 학생 관리 ====================
function renderStudentsTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>👥 학생 목록</h3>
        <span class="badge badge-neutral">${state.students.length}명</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>학번</th><th>이름</th><th>반</th><th>PAIR 수</th><th>관리</th></tr></thead>
          <tbody>
            ${state.students.map(s => {
              const pairCount = (state.myPairs || []).filter(p => (p.studentA === s.studentId || p.studentB === s.studentId) && p.status === 'ACTIVE').length;
              return `
                <tr>
                  <td>${s.studentNumber}</td>
                  <td>${s.studentName}</td>
                  <td>${s.classId}</td>
                  <td>${pairCount}</td>
                  <td>
                    <button class="btn btn-ghost btn-mini reset-pin-btn" data-id="${s.studentId}" data-num="${s.studentNumber}" data-name="${s.studentName}">🔑 PIN 변경</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h3>📤 학생 CSV 업로드</h3>
      </div>
      <div class="upload-panel">
        <input type="file" id="studentCsvFile" accept=".csv" />
        <button id="uploadStudentCsvBtn" class="btn btn-primary">업로드</button>
      </div>
      <p class="help mt-1">형식: studentNumber,studentName,classId (첫 줄은 헤더) · 학생 개인정보(전화번호 등)는 수집하지 않습니다.</p>
    </section>
  `;

  // 학생 PIN 변경 이벤트
  content.querySelectorAll('.reset-pin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.id;
      const studentNumber = btn.dataset.num;
      const studentName = btn.dataset.name;
      const newPin = window.prompt(`[${studentNumber} ${studentName}] 학생의 새 4자리 PIN을 입력하세요:`, '1234');
      if (!newPin) return;
      if (newPin.length !== 4 || isNaN(newPin)) {
        showToast('PIN은 4자리 숫자여야 합니다.', 'error');
        return;
      }
      try {
        await api.updateStudentPin(studentId, newPin, studentNumber);
        showToast(`${studentName} 학생의 PIN이 [${newPin}]로 변경되었습니다.`, 'success');
      } catch (err) {
        showToast(err.message || 'PIN 변경에 실패했습니다.', 'error');
      }
    });
  });

  content.querySelector('#uploadStudentCsvBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('studentCsvFile')?.files[0];
    if (!file) { showToast('파일을 선택해주세요.', 'error'); return; }
    const text = await file.text();
    try {
      await api.uploadStudents(text);
      showToast('학생 목록이 업로드되었습니다.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==================== 과목 관리 ====================
function renderSubjectsTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>📚 과목 목록</h3>
        <span class="badge badge-neutral">${state.subjects.length}개</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>과목ID</th><th>과목명</th><th>만점</th><th>상태</th></tr></thead>
          <tbody>
            ${state.subjects.map(s => `
              <tr>
                <td>${s.subjectId}</td>
                <td>${s.subjectName}</td>
                <td>${s.maxScore}</td>
                <td><span class="badge ${s.active ? 'badge-open' : 'badge-closed'}">${s.active ? '활성' : '비활성'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ==================== 응모 관리 ====================
function renderApplicationTab(content) {
  const globalOpen = state.applicationStatus.globalOpen;
  content.innerHTML = `
    <div class="hero-card teacher">
      <div>
        <p class="eyebrow">응모 관리</p>
        <h2>전체 응모 상태: <span style="color:${globalOpen ? 'var(--good)' : 'var(--danger)'}">${globalOpen ? 'OPEN' : 'CLOSE'}</span></h2>
      </div>
      <button id="toggleGlobalBtn" class="btn ${globalOpen ? 'btn-danger' : 'btn-success'} btn-lg">
        ${globalOpen ? '🔒 전체 마감' : '🔓 전체 열기'}
      </button>
    </div>

    <section class="card">
      <div class="card-head">
        <h3>🔐 과목별 응모 잠금</h3>
        <span class="badge badge-neutral">개별 설정 가능</span>
      </div>
      <div class="subject-locks" id="subjectLocks">
        ${state.subjects.map(s => {
          const isOpen = state.applicationStatus.subjects[s.subjectId] !== false;
          return `<button class="lock-chip ${isOpen ? 'open' : 'closed'}" data-subject="${s.subjectId}">
            ${s.subjectName} · ${isOpen ? 'OPEN' : 'CLOSE'}
          </button>`;
        }).join('')}
      </div>
    </section>
  `;

  content.querySelector('#toggleGlobalBtn')?.addEventListener('click', async () => {
    const newOpen = !globalOpen;
    try {
      await api.setGlobalApplicationStatus(newOpen);
      showToast(newOpen ? '전체 응모를 열었습니다.' : '전체 응모를 마감했습니다.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  content.querySelector('#subjectLocks')?.addEventListener('click', async (e) => {
    const chip = e.target.closest('.lock-chip');
    if (!chip) return;
    const subjectId = chip.dataset.subject;
    const currentOpen = state.applicationStatus.subjects[subjectId] !== false;
    try {
      await api.setSubjectApplicationStatus(subjectId, !currentOpen);
      showToast(`${chip.textContent.split('·')[0].trim()} 응모를 ${!currentOpen ? '열었' : '마감했'}습니다.`, 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==================== PAIR 현황 ====================
function renderPairsTab(content) {
  const activePairs = (state.myPairs || []).filter(p => p.status === 'ACTIVE');
  const pendingRequests = (state.receivedRequests || []).filter(r => r.status === 'PENDING');

  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>🤝 PAIR 현황</h3>
        <span class="badge badge-neutral">${activePairs.length}팀</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>과목</th><th>학생 A</th><th>학생 B</th><th>목표</th><th>미션</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            ${activePairs.map(p => {
              const subject = state.subjects.find(s => s.subjectId === p.subjectId);
              const studentA = state.students.find(s => s.studentId === p.studentA);
              const studentB = state.students.find(s => s.studentId === p.studentB);
              const subs = Array.isArray(state.missionSubmissions)
                ? state.missionSubmissions.filter(s => s.pairId === p.pairId && s.status === 'APPROVED')
                : [];
              return `<tr>
                <td>${subject?.subjectName || p.subjectId}</td>
                <td>${studentA?.studentName || p.studentA}</td>
                <td>${studentB?.studentName || p.studentB}</td>
                <td>${p.target}</td>
                <td>${subs.length}/${state.missions.length}</td>
                <td><span class="badge badge-open">성사</span></td>
                <td>
                  <button class="btn btn-ghost btn-mini delete-pair-btn" data-id="${p.pairId}">삭제</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h3>📨 대기 중인 신청</h3>
        <span class="badge badge-warning">${pendingRequests.length}건</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>과목</th><th>신청자</th><th>대상</th><th>목표</th><th>상태</th><th>날짜</th></tr></thead>
          <tbody>
            ${pendingRequests.map(r => {
              const subject = state.subjects.find(s => s.subjectId === r.subjectId);
              const from = state.students.find(s => s.studentId === r.fromId);
              const to = state.students.find(s => s.studentId === r.toId);
              return `<tr>
                <td>${subject?.subjectName || r.subjectId}</td>
                <td>${from?.studentName || r.fromId}</td>
                <td>${to?.studentName || r.toId}</td>
                <td>${r.target}</td>
                <td><span class="badge badge-warning">대기</span></td>
                <td>${formatDate(r.createdAt)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  content.querySelectorAll('.delete-pair-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await showConfirm('이 PAIR를 삭제하시겠습니까? 되돌릴 수 없습니다.');
      if (!ok) return;
      try {
        await api.deletePair(btn.dataset.id);
        showToast('PAIR를 삭제했습니다.', 'success');
        await loadAdminData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

// ==================== 미션 인증 ====================
function renderMissionsTab(content) {
  const submissions = Array.isArray(state.missionSubmissions) ? state.missionSubmissions : [];
  const approved = submissions.filter(s => s.status === 'APPROVED');

  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>📷 미션 인증 확인</h3>
        <span class="badge badge-neutral">기본 자동 승인 · 필요 시 취소</span>
      </div>
      ${approved.length === 0 ? '<div class="empty-state"><p>아직 제출된 미션이 없습니다.</p></div>' : ''}
      <div class="approval-grid">
        ${approved.map(s => {
          const pair = (state.myPairs || []).find(p => p.pairId === s.pairId);
          const subject = state.subjects.find(sub => sub.subjectId === s.subjectId);
          const uploader = state.students.find(st => st.studentId === s.uploaderId);
          const mission = state.missions.find(m => m.missionId === s.missionId);
          return `<article>
            <b>${subject?.subjectName || s.subjectId} · ${uploader?.studentName || s.uploaderId}</b>
            <p>${mission?.title || s.missionId} / ${formatDate(s.submittedAt)}</p>
            <div class="placeholder">인증사진</div>
            <div class="row-actions">
              <button class="btn btn-danger btn-mini revoke-btn" data-id="${s.submissionId}">인증 취소</button>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `;

  content.querySelectorAll('.revoke-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await showConfirm('이 미션 인증을 취소하시겠습니까?');
      if (!ok) return;
      try {
        await api.revokeMission(btn.dataset.id);
        showToast('인증을 취소했습니다.', 'success');
        await loadAdminData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

// ==================== 시험 점수 ====================
function renderScoresTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>📊 시험 결과 업로드</h3>
        <span class="badge badge-neutral">CSV 지원</span>
      </div>
      <div class="upload-panel">
        <input id="scoreFile" type="file" accept=".csv,.xlsx,.xls" />
        <button id="uploadScoreBtn" class="btn btn-primary">업로드 후 자동 판정</button>
      </div>
      <p class="help mt-1">형식: 학번, 이름, 국어, 영어, 수학, 과학 (첫 줄은 헤더)</p>
      <div id="scoreUploadResult" class="hidden"></div>
    </section>
  `;

  content.querySelector('#uploadScoreBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('scoreFile')?.files[0];
    if (!file) { showToast('파일을 선택해주세요.', 'error'); return; }

    const btn = document.getElementById('uploadScoreBtn');
    btn.disabled = true;
    btn.textContent = '처리 중...';

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      // 학번 컬럼 찾기
      const numberCol = headers.find(h => h.includes('학번') || h === 'studentNumber') || headers[0];

      // 과목 매핑: 과목명 → subjectId
      const subjectMap = {};
      state.subjects.forEach(s => {
        subjectMap[s.subjectName] = s.subjectId;
      });

      // 학생-과목 점수 데이터 생성
      const examData = [];
      rows.forEach(row => {
        const studentNumber = String(row[numberCol] || '').trim();
        const student = state.students.find(s => s.studentNumber === studentNumber);
        if (!student) return;

        Object.keys(subjectMap).forEach(subjectName => {
          if (row[subjectName] !== undefined && row[subjectName] !== '') {
            examData.push({
              studentId: student.studentId,
              subjectId: subjectMap[subjectName],
              score: Number(row[subjectName])
            });
          }
        });
      });

      // 업로드
      await api.uploadExamResults(examData);
      showToast(`${examData.length}건의 점수를 업로드했습니다.`, 'success');

      // 자동 판정
      const result = await api.calculateResults();
      const resultDiv = document.getElementById('scoreUploadResult');
      if (resultDiv && result.results) {
        const wins = result.results.filter(r => r.result === 'WIN' || r.result === 'JACKPOT').length;
        const jackpots = result.results.filter(r => r.result === 'JACKPOT').length;
        resultDiv.className = 'analysis-result success';
        resultDiv.textContent = `✅ 분석 완료: ${result.results.length}개 페어 중 ${wins}개 WIN, ${jackpots}개 JACKPOT`;
      }

      await loadAdminData();
    } catch (err) {
      showToast(err.message || '업로드에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '업로드 후 자동 판정';
    }
  });
}

// ==================== 당첨 결과 ====================
function renderResultsTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>🏆 당첨 결과</h3>
        <button id="recalculateBtn" class="btn btn-ghost btn-mini">재계산</button>
      </div>
      <div id="resultsTableContainer">
        <div class="loading-spinner"><div class="spinner"></div><p>결과를 불러오는 중...</p></div>
      </div>
    </section>
  `;

  loadResults(content);

  content.querySelector('#recalculateBtn')?.addEventListener('click', async () => {
    try {
      await api.calculateResults();
      showToast('결과를 재계산했습니다.', 'success');
      loadResults(content);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function loadResults(content) {
  try {
    const res = await api.getAllResults();
    const results = res.results || [];
    const container = document.getElementById('resultsTableContainer');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>아직 판정된 결과가 없습니다.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>과목</th><th>학생 A</th><th>점수 A</th><th>학생 B</th><th>점수 B</th><th>합산</th><th>TARGET</th><th>범위</th><th>결과</th></tr></thead>
          <tbody>
            ${results.map(r => {
              const subject = state.subjects.find(s => s.subjectId === r.subjectId);
              const sA = state.students.find(s => s.studentId === r.studentA);
              const sB = state.students.find(s => s.studentId === r.studentB);
              const resultBadge = r.result === 'JACKPOT' ? 'badge-warning' :
                                  r.result === 'WIN' ? 'badge-open' :
                                  r.result === 'NEAR_MISS' ? 'badge-neutral' : 'badge-closed';
              return `<tr>
                <td>${subject?.subjectName || r.subjectId}</td>
                <td>${sA?.studentName || r.studentA}</td>
                <td>${r.scoreA}</td>
                <td>${sB?.studentName || r.studentB}</td>
                <td>${r.scoreB}</td>
                <td><b>${r.sum}</b></td>
                <td>${r.target}</td>
                <td>${r.rangeMin}~${r.rangeMax}</td>
                <td><span class="badge ${resultBadge}">${r.result}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

// ==================== 설정 ====================
function renderSettingsTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>⚙️ 설정</h3>
      </div>
      <div class="form-grid" style="max-width:500px">
        <div class="form-group">
          <label class="form-label">기본 당첨 범위 (±점)</label>
          <input type="number" id="settingBaseRange" class="form-input" value="${BASE_RANGE}" />
        </div>
        <div class="form-group">
          <label class="form-label">미션당 추가 범위</label>
          <input type="number" id="settingBonusPerMission" class="form-input" value="${BONUS_PER_MISSION}" />
        </div>
        <div class="form-group">
          <label class="form-label">NEAR MISS 판정 범위</label>
          <input type="number" id="settingNearMiss" class="form-input" value="${NEAR_MISS_RANGE}" />
        </div>
        <div class="form-group">
          <label class="form-label">TARGET 후보 (쉼표 구분)</label>
          <input type="text" id="settingTargets" class="form-input" value="${TARGET_OPTIONS.join(',')}" />
        </div>
        <button id="saveSettingsBtn" class="btn btn-primary btn-wide">설정 저장</button>
      </div>
    </section>
  `;

  content.querySelector('#saveSettingsBtn')?.addEventListener('click', async () => {
    try {
      await api.updateSettings({
        BASE_RANGE: Number(document.getElementById('settingBaseRange').value),
        BONUS_PER_MISSION: Number(document.getElementById('settingBonusPerMission').value),
        NEAR_MISS_RANGE: Number(document.getElementById('settingNearMiss').value),
        TARGET_OPTIONS: document.getElementById('settingTargets').value,
      });
      showToast('설정이 저장되었습니다.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
