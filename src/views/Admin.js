/**
 * 관리자 대시보드 화면
 * 프로토타입의 교사 뷰를 보존하면서 전체 관리 기능을 구현합니다.
 * 메뉴: 대시보드, 학생관리, 과목관리, 응모관리, PAIR현황, 미션인증, 시험점수, 당첨결과, 설정
 */
import { api } from '../services/index.js';
import { state, clearAdminSession, notify } from '../state.js';
import { TARGET_OPTIONS, BASE_RANGE, BONUS_PER_MISSION, NEAR_MISS_RANGE } from '../config.js';
import { el, showToast, showConfirm, parseCSV, getFooterHTML, formatDate } from '../utils/helpers.js';
import * as XLSX from 'xlsx';
import { TEXTS } from '../texts.js';

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
  const maxPairs = stats.totalStudents || 0;
  const currentPairs = stats.activePairs || 0;
  const completionRate = maxPairs > 0 ? Math.round((currentPairs / maxPairs) * 100) : 0;
  const isAllMatched = maxPairs > 0 && currentPairs >= maxPairs;

  content.innerHTML = `
    <div class="hero-card teacher">
      <div>
        <p class="eyebrow">${TEXTS.brand.adminBadge}</p>
        <h2>${TEXTS.admin.dashboard.title}</h2>
        <p class="sub">${TEXTS.admin.dashboard.subtitle}</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button id="toggleLockBtn" class="btn ${state.applicationStatus.globalOpen ? 'btn-danger' : 'btn-success'} btn-lg">
          ${state.applicationStatus.globalOpen ? TEXTS.admin.dashboard.closeAllBtn : TEXTS.admin.dashboard.openAllBtn}
        </button>
        <button id="autoMatchBtn" class="btn btn-gold btn-lg" style="box-shadow:0 0 16px rgba(255,209,102,0.4);" title="${TEXTS.admin.pairs.autoMatchNotice}">
          ${TEXTS.admin.dashboard.autoMatchBtn}
        </button>
      </div>
    </div>

    <!-- 매칭 달성 현황 지표 카드 -->
    <div class="card" style="margin-bottom:20px; padding:20px; border-left:4px solid ${isAllMatched ? 'var(--good)' : 'var(--neon-cyan)'};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="margin:0 0 6px 0; font-size:16px; color:var(--text);">전체 매칭 달성 현황</h3>
          <p style="margin:0; font-size:13px; color:var(--text-secondary);">모든 학생이 2개씩 페어를 맺기 위한 목표 달성률입니다.</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px; font-weight:900; color:var(--text); font-family:'BcCardFont', sans-serif;">
            ${currentPairs} / ${maxPairs} <span style="font-size:16px; color:var(--gold);">(${completionRate}%)</span>
          </div>
          ${isAllMatched 
            ? `<div style="margin-top:4px;"><span class="badge badge-open" style="font-size:13px; padding:4px 10px; font-weight:800; box-shadow:0 0 12px rgba(0,255,136,0.3);">🎉 전원 매칭 완료!</span></div>`
            : `<div style="margin-top:4px;"><span class="badge badge-warning" style="font-size:12px;">진행 중</span></div>`
          }
        </div>
      </div>
      <div style="margin-top:16px; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
        <div style="height:100%; width:${completionRate}%; background:${isAllMatched ? 'var(--good)' : 'var(--neon-cyan)'}; transition:width 0.5s ease;"></div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat"><span>${TEXTS.admin.dashboard.totalStudents}</span><b class="sum-num">${stats.totalStudents || 0}</b><span class="unit">명</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.activePairs}</span><b class="sum-num">${stats.activePairs || 0}</b><span class="unit">팀</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.pendingRequests}</span><b class="sum-num">${stats.pendingRequests || 0}</b><span class="unit">건</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.completedMissions}</span><b class="sum-num">${stats.completedMissions || 0}</b><span class="unit">건</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.unmatchedStudents}</span><b class="sum-num" style="color:var(--warning);">${stats.studentsWithoutPairs || 0}</b><span class="unit">명</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.scoreUploadStatus}</span><b class="sum-num" style="font-size:26px">${stats.resultsUploaded ? '완료' : '대기'}</b></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.winningPairs}</span><b class="sum-num">${stats.winCount || 0}</b><span class="unit">팀</span></div>
      <div class="stat"><span>${TEXTS.admin.dashboard.currentStatus}</span><b class="sum-num" style="font-size:26px;color:${state.applicationStatus.globalOpen ? 'var(--good)' : 'var(--danger)'}">${state.applicationStatus.globalOpen ? 'OPEN' : 'CLOSE'}</b></div>
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

  // 소외 방지 미응모 학생 자동 매칭 (미리보기 및 수동 편집 후 최종 확정)
  content.querySelector('#autoMatchBtn')?.addEventListener('click', () => {
    startAutoMatchFlow();
  });
}

// ==================== 학생 관리 ====================
function renderStudentsTab(content) {
  content.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h3>${TEXTS.admin.students.title}</h3>
        <span class="badge badge-neutral">${state.students.length}명</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
              <th>성사된 PAIR</th>
              <th>비밀번호 관리</th>
            </tr>
          </thead>
          <tbody>
            ${state.students.map(s => {
              const pairCount = (state.myPairs || []).filter(p => (p.studentA === s.studentId || p.studentB === s.studentId) && p.status === 'ACTIVE').length;
              return `
                <tr>
                  <td><b>${s.studentNumber}</b></td>
                  <td>${s.studentName}</td>
                  <td><span class="badge ${pairCount > 0 ? 'badge-open' : 'badge-neutral'}">${pairCount}/2 완료</span></td>
                  <td>
                    <button class="btn btn-ghost btn-mini reset-pin-btn" data-id="${s.studentId}" data-num="${s.studentNumber}" data-name="${s.studentName}">
                      ${TEXTS.admin.students.resetPinBtn}
                    </button>
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
        <h3>${TEXTS.admin.students.uploadTitle}</h3>
        <span class="badge badge-neutral">엑셀 / CSV 지원</span>
      </div>
      <div class="upload-panel">
        <input type="file" id="studentFile" accept=".xlsx,.xls,.csv" />
        <button id="uploadStudentBtn" class="btn btn-primary">명단 업로드</button>
      </div>
      <p class="help mt-1">${TEXTS.admin.students.uploadHelp}</p>
    </section>
  `;

  // 학생 PIN 초기화 이벤트 (학생이 직접 [처음이에요]에서 재설정)
  content.querySelectorAll('.reset-pin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.id;
      const studentNumber = btn.dataset.num;
      const studentName = btn.dataset.name;

      const ok = await showConfirm(
        `[${studentNumber} ${studentName}] ${TEXTS.admin.students.resetConfirm}`
      );
      if (!ok) return;

      try {
        await api.resetStudentPin(studentId, studentNumber);
        showToast(`${studentName} ${TEXTS.admin.students.resetSuccess}`, 'success');
        await loadAdminData();
      } catch (err) {
        showToast(err.message || '초기화에 실패했습니다.', 'error');
      }
    });
  });

  // 학생 명단 업로드 (엑셀 및 CSV 완벽 지원)
  content.querySelector('#uploadStudentBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('studentFile')?.files[0];
    if (!file) { showToast('파일을 선택해주세요.', 'error'); return; }

    const btn = document.getElementById('uploadStudentBtn');
    btn.disabled = true;
    btn.textContent = '업로드 중...';

    try {
      let csvContent = '';
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        csvContent = XLSX.utils.sheet_to_csv(ws);
      } else {
        csvContent = await file.text();
      }

      await api.uploadStudents(csvContent);
      showToast('학생 명단이 성공적으로 업로드되었습니다.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message || '학생 명단 업로드에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '명단 업로드';
    }
  });
}

// ==================== 과목 관리 ====================
function renderSubjectsTab(content) {
  content.innerHTML = `
    <!-- 새 과목 추가 폼 -->
    <section class="card">
      <div class="card-head">
        <h3>${TEXTS.admin.subjects.addTitle}</h3>
        <span class="badge badge-neutral">한글 과목명 지원</span>
      </div>
      <div class="form-grid" style="grid-template-columns: 2fr 1fr auto; gap:12px; align-items:flex-end;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">${TEXTS.admin.subjects.nameLabel}</label>
          <input type="text" id="newSubjectName" class="form-input" placeholder="${TEXTS.admin.subjects.namePlaceholder}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">${TEXTS.admin.subjects.maxScoreLabel}</label>
          <input type="number" id="newSubjectMaxScore" class="form-input" value="100" min="10" max="1000" />
        </div>
        <div>
          <button id="addSubjectBtn" class="btn btn-primary" style="height:44px; white-space:nowrap;">${TEXTS.admin.subjects.addBtn}</button>
        </div>
      </div>
      <p class="help mt-1" style="color:var(--neon-cyan);">${TEXTS.admin.subjects.autoIdNotice}</p>
    </section>

    <!-- 과목 목록 -->
    <section class="card">
      <div class="card-head">
        <h3>${TEXTS.admin.subjects.title}</h3>
        <span class="badge badge-neutral">${state.subjects.length}개</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>과목명</th>
              <th>만점</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${state.subjects.map(s => `
              <tr>
                <td><b style="font-size:15px; color:var(--text);">${s.subjectName}</b></td>
                <td>${s.maxScore}점</td>
                <td><span class="badge ${s.active ? 'badge-open' : 'badge-closed'}">${s.active ? '활성' : '비활성'}</span></td>
                <td>
                  <button class="btn btn-danger btn-mini delete-subject-btn" data-id="${s.subjectId}" data-name="${s.subjectName}">
                    ${TEXTS.admin.subjects.deleteBtn}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  // 과목 추가 이벤트
  content.querySelector('#addSubjectBtn')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('newSubjectName');
    const scoreInput = document.getElementById('newSubjectMaxScore');
    const name = nameInput?.value.trim();
    const maxScore = Number(scoreInput?.value || 100);

    if (!name) {
      showToast('과목명을 입력해주세요.', 'error');
      nameInput?.focus();
      return;
    }

    try {
      await api.addSubject(name, maxScore);
      showToast(`'${name}' 과목이 성공적으로 추가되었습니다.`, 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message || '과목 추가에 실패했습니다.', 'error');
    }
  });

  // 과목 삭제 이벤트
  content.querySelectorAll('.delete-subject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const subjectId = btn.dataset.id;
      const subjectName = btn.dataset.name;

      const ok = await showConfirm(`'${subjectName}' ${TEXTS.admin.subjects.deleteConfirm}`);
      if (!ok) return;

      try {
        await api.deleteSubject(subjectId);
        showToast(`'${subjectName}' 과목을 삭제했습니다.`, 'success');
        await loadAdminData();
      } catch (err) {
        showToast(err.message || '과목 삭제에 실패했습니다.', 'error');
      }
    });
  });
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
      <div class="card-head" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3>🤝 PAIR 현황</h3>
          <span class="badge badge-neutral">${activePairs.length}팀</span>
        </div>
        <button id="autoMatchInPairsBtn" class="btn btn-gold btn-sm" style="box-shadow:0 0 12px rgba(255,209,102,0.35);">
          ✨ 미응모 학생 자동 매칭
        </button>
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

  content.querySelector('#autoMatchInPairsBtn')?.addEventListener('click', () => {
    startAutoMatchFlow();
  });

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
        <h3>${TEXTS.admin.missions.title}</h3>
        <span class="badge badge-neutral">${TEXTS.admin.missions.badge}</span>
      </div>
      ${approved.length === 0 ? `<div class="empty-state"><p>${TEXTS.admin.missions.empty}</p></div>` : ''}
      <div class="approval-grid">
        ${approved.map(s => {
          const pair = (state.myPairs || []).find(p => p.pairId === s.pairId);
          const subject = state.subjects.find(sub => sub.subjectId === s.subjectId);
          const uploader = state.students.find(st => st.studentId === s.uploaderId);
          const mission = state.missions.find(m => m.missionId === s.missionId);
          return `<article>
            <b>${subject?.subjectName || s.subjectId} · ${uploader?.studentName || s.uploaderId}</b>
            <p>${mission?.title || s.missionId} / ${formatDate(s.submittedAt)}</p>
            
            ${s.fileUrl ? `
              <div class="mission-photo-box" style="margin: 10px 0;">
                <a href="https://drive.google.com/drive/folders/1aqPUUjQbMTllHDx0HYiKSVJvWY3ymvPR?usp=drive_link" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="width:100%; font-size:13px; color:var(--neon-cyan); border:1px solid rgba(0,240,255,0.3); text-decoration:none; display:flex; justify-content:center; align-items:center; padding:10px; border-radius:8px;">
                  📁 구글 드라이브에서 사진 확인 ↗
                </a>
              </div>
            ` : `
              <div class="placeholder" style="margin:10px 0; border-radius:8px;">📷 ${TEXTS.admin.missions.noPhoto}</div>
            `}

            <div class="row-actions">
              <button class="btn btn-danger btn-mini revoke-btn" data-id="${s.submissionId}">
                ${TEXTS.admin.missions.revokeBtn}
              </button>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `;

  // 인증 취소 이벤트
  content.querySelectorAll('.revoke-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await showConfirm(TEXTS.admin.missions.revokeConfirm);
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
        <h3>${TEXTS.admin.scores.title}</h3>
        <span class="badge badge-neutral">${TEXTS.admin.scores.badge}</span>
      </div>
      <div class="upload-panel">
        <input id="scoreFile" type="file" accept=".xlsx,.xls,.csv" />
        <button id="uploadScoreBtn" class="btn btn-primary">${TEXTS.admin.scores.uploadBtn}</button>
      </div>
      <p class="help mt-1">${TEXTS.admin.scores.help}</p>
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
      let rows = [];
      let headers = [];

      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows.length > 0) {
          headers = Object.keys(rows[0]);
        }
      } else {
        const text = await file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
      }

      if (rows.length === 0) {
        throw new Error('파일에 데이터가 없습니다.');
      }

      // 학번 컬럼 찾기 (학번, studentNumber, student_number 등 유연한 매칭)
      const numberCol = headers.find(h => {
        const lower = String(h).toLowerCase().trim();
        return lower.includes('학번') || lower === 'studentnumber' || lower === 'id';
      }) || headers[0];

      // 과목 매핑 (과목명 및 subjectId 지원)
      const subjectMap = {};
      state.subjects.forEach(s => {
        subjectMap[s.subjectName.trim()] = s.subjectId;
        subjectMap[s.subjectId.trim()] = s.subjectId;
      });

      // 학생-과목 점수 데이터 추출
      const examData = [];
      rows.forEach(row => {
        const studentNumber = String(row[numberCol] || '').trim();
        const student = state.students.find(s => s.studentNumber === studentNumber);
        if (!student) return;

        Object.keys(row).forEach(colName => {
          const cleanCol = colName.trim();
          const targetSubId = subjectMap[cleanCol];
          if (targetSubId && row[colName] !== undefined && row[colName] !== '') {
            const numScore = Number(row[colName]);
            if (!isNaN(numScore)) {
              examData.push({
                studentId: student.studentId,
                subjectId: targetSubId,
                score: numScore
              });
            }
          }
        });
      });

      if (examData.length === 0) {
        throw new Error('인식 가능한 학생 학번 및 과목 점수 데이터를 찾지 못했습니다. 학번과 과목명(국어, 영어 등) 헤더를 확인해주세요.');
      }

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
      btn.textContent = TEXTS.admin.scores.uploadBtn;
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

        <div class="form-group" style="margin-top: 30px; border-top: 1px solid var(--line); padding-top: 20px;">
          <h4 style="color:var(--danger); margin-bottom: 10px;">⚠️ 위험 구역</h4>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:10px;">학생 명단과 과목 설정을 제외한 모든 매칭/응모/퀘스트/점수 기록을 완전히 초기화합니다.</p>
          <button id="resetAllRecordsBtn" class="btn btn-danger btn-wide">전체 기록 초기화 (리셋)</button>
        </div>
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

  content.querySelector('#resetAllRecordsBtn')?.addEventListener('click', async () => {
    const ok = await showConfirm('정말 모든 매칭 및 응모 기록을 초기화하시겠습니까? (학생 명단 제외)\n이 작업은 되돌릴 수 없습니다.');
    if (!ok) return;
    try {
      await api.resetAllRecords();
      showToast('모든 기록이 초기화되었습니다.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==================== 자동 매칭 미리보기 및 수동 편집/최종 확정 ====================

/** 관리자: 미응모 학생 자동 매칭 플로우 시작 (미리보기 호출) */
async function startAutoMatchFlow() {
  showToast('자동 매칭 후보를 시뮬레이션하는 중입니다...', 'info');

  try {
    const res = await api.previewAutoMatch();
    if (!res.ok) throw new Error(res.error || '자동 매칭 시뮬레이션 실패');

    if (!res.previewPairs || res.previewPairs.length === 0) {
      showToast(res.message || '매칭할 대상 학생이 없거나 모두 2개 페어를 완료했습니다.', 'info');
      return;
    }

    openAutoMatchModal(res);
  } catch (err) {
    showToast(err.message || '자동 매칭에 실패했습니다.', 'error');
  }
}

/** 관리자: 자동 매칭 미리보기 및 교사 수동 편집/최종 확정 모달 */
function openAutoMatchModal(previewData) {
  let pairs = (previewData.previewPairs || []).map(p => ({ ...p }));
  const allStudents = state.students || [];
  const subjects = (state.subjects || []).filter(s => s.active);

  const modal = el('div', { className: 'modal-overlay automatch-modal-overlay' });
  modal.innerHTML = `
    <div class="modal-box automatch-modal-box" style="max-width: 900px; width: 96vw; max-height: 92vh; display: flex; flex-direction: column; padding: 24px; background: var(--card); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow-lg);">
      <!-- 헤더 -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; border-bottom:1px solid var(--line); padding-bottom:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">🎲</span>
            <h3 style="margin:0; font-size:19px; font-weight:800; color:var(--text);" id="modalTitle">
              미응모 학생 자동 매칭 미리보기
            </h3>
            <span class="badge badge-warning" id="modalPairCountBadge" style="font-size:12px;">${pairs.length}팀</span>
          </div>
          <p style="margin:6px 0 0; font-size:13px; color:var(--text-secondary); line-height:1.5; word-break:keep-all;">
            아직 짝이 없거나 1명뿐인 학생들을 공평하게 연결했습니다. <b>파트너, 과목, 목표 점수를 자유롭게 수정한 뒤 [최종 확정 저장]</b>을 누르세요.
          </p>
        </div>
        <button type="button" class="btn btn-ghost btn-mini close-automatch-btn" style="font-size:16px; font-weight:bold; padding:4px 10px;">✕</button>
      </div>

      <!-- 상단 컨트롤 (재추천 및 행 추가) -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px; flex-wrap:wrap;">
        <div style="font-size:13px; color:var(--neon-cyan); font-weight:700;">
          💡 수정 팁: 드롭다운을 열어 원하는 학생이나 목표점수를 바로 바꿀 수 있습니다.
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" id="reRollBtn" class="btn btn-ghost btn-mini" style="color:var(--gold); border:1px solid rgba(255,209,102,0.3);">
            🎲 다시 섞기 (재추천)
          </button>
          <button type="button" id="addPairBtn" class="btn btn-primary btn-mini" style="font-weight:700;">
            ➕ 새 매칭 추가
          </button>
        </div>
      </div>

      <!-- 페어 목록 테이블/리스트 영역 (스크롤 가능) -->
      <div style="flex:1; overflow-y:auto; border:1px solid var(--line); border-radius:12px; background:rgba(0,0,0,0.25); padding:10px;" id="pairListContainer">
        <!-- 렌더링될 내용 -->
      </div>

      <!-- 미매칭 학생 현황 바 -->
      <div style="margin-top:12px; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px dashed var(--line); border-radius:10px; font-size:12.5px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <span style="color:var(--text-secondary);">
          👥 <b>미매칭 학생 풀:</b> <span id="unmatchedNames" style="color:var(--gold);">-</span>
        </span>
        <span style="color:var(--muted); font-size:11.5px;">* 1인당 최대 2개 페어 (서로 다른 학생/과목)</span>
      </div>

      <!-- 하단 액션 버튼 -->
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px; border-top:1px solid var(--line); padding-top:14px;">
        <button type="button" class="btn btn-ghost cancel-btn" style="min-width:90px;">취소</button>
        <button type="button" id="saveConfirmBtn" class="btn btn-gold btn-lg" style="font-weight:900; font-size:15px; padding:12px 28px; box-shadow:0 0 16px rgba(255,209,102,0.4);">
          💾 최종 확정 저장 (${pairs.length}팀)
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => modal.classList.add('show'));

  const closeModal = () => {
    modal.classList.remove('show');
    document.removeEventListener('keydown', handleKeydown);
    setTimeout(() => modal.remove(), 200);
  };
  const handleKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleKeydown);

  modal.querySelector('.close-automatch-btn')?.addEventListener('click', closeModal);
  modal.querySelector('.cancel-btn')?.addEventListener('click', closeModal);

  // 실시간 렌더링 함수
  function updateModalUI() {
    const container = modal.querySelector('#pairListContainer');
    const countBadge = modal.querySelector('#modalPairCountBadge');
    const saveBtn = modal.querySelector('#saveConfirmBtn');
    const unmatchedSpan = modal.querySelector('#unmatchedNames');

    if (countBadge) countBadge.textContent = `${pairs.length}팀`;
    if (saveBtn) saveBtn.textContent = `💾 최종 확정 저장 (${pairs.length}팀)`;

    // 미매칭 학생 계산
    const currentPairCount = {};
    allStudents.forEach(s => { currentPairCount[s.studentId] = 0; });
    // 기존 활성 페어
    (state.myPairs || []).filter(p => p.status === 'ACTIVE').forEach(p => {
      if (currentPairCount[p.studentA] !== undefined) currentPairCount[p.studentA]++;
      if (currentPairCount[p.studentB] !== undefined) currentPairCount[p.studentB]++;
    });
    // 현재 모달 내 페어
    pairs.forEach(p => {
      if (currentPairCount[p.studentA] !== undefined) currentPairCount[p.studentA]++;
      if (currentPairCount[p.studentB] !== undefined) currentPairCount[p.studentB]++;
    });

    const stillUnmatched = allStudents.filter(s => (currentPairCount[s.studentId] || 0) < 2);
    if (unmatchedSpan) {
      if (stillUnmatched.length === 0) {
        unmatchedSpan.innerHTML = '<b style="color:var(--good);">모든 학생이 2/2 매칭 완료되었습니다! ✨</b>';
      } else {
        unmatchedSpan.textContent = stillUnmatched.map(s => `${s.studentNumber} ${s.studentName} (${currentPairCount[s.studentId]}/2)`).join(', ');
      }
    }

    if (pairs.length === 0) {
      container.innerHTML = `
        <div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">
          <div style="font-size:32px; margin-bottom:8px;">📭</div>
          <p>편성된 매칭 팀이 없습니다.</p>
          <button type="button" class="btn btn-primary btn-sm mt-1" id="emptyAddBtn">➕ 팀 추가하기</button>
        </div>
      `;
      container.querySelector('#emptyAddBtn')?.addEventListener('click', addNewPairRow);
      return;
    }

    let html = `
      <table style="width:100%; border-collapse:collapse; font-size:13.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--line); color:var(--text-secondary); text-align:left; font-size:12px;">
            <th style="padding:8px 6px; width:44px; text-align:center;">팀</th>
            <th style="padding:8px 6px;">학생 A</th>
            <th style="padding:8px 6px; text-align:center; width:28px;">×</th>
            <th style="padding:8px 6px;">짝꿍 학생 B (수동 변경 가능)</th>
            <th style="padding:8px 6px; width:130px;">과목</th>
            <th style="padding:8px 6px; width:110px;">목표 합산점수</th>
            <th style="padding:8px 6px; width:50px; text-align:center;">제외</th>
          </tr>
        </thead>
        <tbody>
    `;

    pairs.forEach((pair, idx) => {
      const isSameStudent = pair.studentA && pair.studentA === pair.studentB;

      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06); ${isSameStudent ? 'background:rgba(255,42,133,0.12);' : ''}">
          <td style="padding:10px 6px; text-align:center; font-weight:800; color:var(--gold);">#${idx + 1}</td>
          
          <!-- 학생 A 드롭다운 -->
          <td style="padding:10px 6px;">
            <select class="form-select pair-student-a" data-idx="${idx}" style="padding:6px 10px; font-size:13px; font-weight:700; width:100%;">
              ${allStudents.map(s => `
                <option value="${s.studentId}" ${s.studentId === pair.studentA ? 'selected' : ''}>
                  ${s.studentNumber} ${s.studentName}
                </option>
              `).join('')}
            </select>
          </td>

          <td style="padding:10px 4px; text-align:center; font-weight:900; color:var(--gold);">×</td>

          <!-- 학생 B 드롭다운 -->
          <td style="padding:10px 6px;">
            <select class="form-select pair-student-b" data-idx="${idx}" style="padding:6px 10px; font-size:13px; font-weight:700; width:100%;">
              ${allStudents.map(s => `
                <option value="${s.studentId}" ${s.studentId === pair.studentB ? 'selected' : ''}>
                  ${s.studentNumber} ${s.studentName} ${s.studentId === pair.studentA ? '⚠️(동일)' : ''}
                </option>
              `).join('')}
            </select>
          </td>

          <!-- 과목 드롭다운 -->
          <td style="padding:10px 6px;">
            <select class="form-select pair-subject" data-idx="${idx}" style="padding:6px 10px; font-size:13px; width:100%;">
              ${subjects.map(sub => `
                <option value="${sub.subjectId}" ${sub.subjectId === pair.subjectId ? 'selected' : ''}>
                  ${sub.subjectName}
                </option>
              `).join('')}
            </select>
          </td>

          <!-- 목표 점수 드롭다운 -->
          <td style="padding:10px 6px;">
            <select class="form-select pair-target" data-idx="${idx}" style="padding:6px 10px; font-size:13px; font-weight:800; color:var(--gold); width:100%;">
              ${TARGET_OPTIONS.map(t => `
                <option value="${t}" ${Number(pair.target) === Number(t) ? 'selected' : ''}>
                  ${t}점
                </option>
              `).join('')}
            </select>
          </td>

          <!-- 삭제 버튼 -->
          <td style="padding:10px 6px; text-align:center;">
            <button type="button" class="btn btn-ghost btn-mini remove-pair-row" data-idx="${idx}" style="color:var(--danger); font-size:12px; padding:4px 8px;" title="이 팀 매칭에서 제외">
              🗑️
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    // 이벤트 리스너 바인딩
    container.querySelectorAll('.pair-student-a').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        pairs[idx].studentA = e.target.value;
        updateModalUI();
      });
    });

    container.querySelectorAll('.pair-student-b').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        pairs[idx].studentB = e.target.value;
        updateModalUI();
      });
    });

    container.querySelectorAll('.pair-subject').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        pairs[idx].subjectId = e.target.value;
      });
    });

    container.querySelectorAll('.pair-target').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        pairs[idx].target = Number(e.target.value);
      });
    });

    container.querySelectorAll('.remove-pair-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        pairs.splice(idx, 1);
        updateModalUI();
      });
    });
  }

  function addNewPairRow() {
    const defSub = subjects[0]?.subjectId || 'korean';
    const sA = allStudents[0]?.studentId || '';
    const sB = allStudents[1]?.studentId || allStudents[0]?.studentId || '';
    pairs.push({
      tempId: 'manual_' + Date.now(),
      studentA: sA,
      studentB: sB,
      subjectId: defSub,
      target: 180,
    });
    updateModalUI();
  }

  // 상단 새 팀 추가 버튼
  modal.querySelector('#addPairBtn')?.addEventListener('click', addNewPairRow);

  // 상단 다시 섞기 버튼
  modal.querySelector('#reRollBtn')?.addEventListener('click', async () => {
    try {
      showToast('새로운 추천 매칭을 생성하는 중...', 'info');
      const fresh = await api.previewAutoMatch();
      if (fresh.ok && fresh.previewPairs) {
        pairs = fresh.previewPairs.map(p => ({ ...p }));
        updateModalUI();
        showToast('새로운 매칭 추천으로 재구성되었습니다.', 'success');
      }
    } catch (err) {
      showToast(err.message || '재추천 실패', 'error');
    }
  });

  // 최종 확정 저장 버튼
  modal.querySelector('#saveConfirmBtn')?.addEventListener('click', async () => {
    if (pairs.length === 0) {
      showToast('저장할 매칭 팀이 없습니다.', 'error');
      return;
    }

    // 유효성 검사
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (p.studentA === p.studentB) {
        const st = allStudents.find(s => s.studentId === p.studentA);
        showToast(`[#${i + 1}팀] ${st?.studentName || p.studentA} 학생이 자기 자신과 매칭되었습니다. 다른 파트너를 선택해주세요.`, 'error');
        return;
      }
    }

    const ok = await showConfirm(
      `총 ${pairs.length}개의 매칭을 최종 확정하시겠습니까?\n\n* 확정 즉시 학생들의 PAIR 목록에 정식 등록됩니다.`
    );
    if (!ok) return;

    const saveBtn = modal.querySelector('#saveConfirmBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
      const res = await api.saveAutoMatchedPairs(pairs);
      showToast(`🎉 ${res.savedCount || pairs.length}개의 페어가 성공적으로 최종 확정되었습니다!`, 'success');
      closeModal();
      await loadAdminData();
    } catch (err) {
      showToast(err.message || '매칭 저장에 실패했습니다.', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = `💾 최종 확정 저장 (${pairs.length}팀)`;
    }
  });

  // 최초 렌더링
  updateModalUI();
}
