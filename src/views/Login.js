/**
 * 학생 로그인 화면
 * 학번 선택 + PIN 입력 방식
 */
import { api } from '../services/index.js';
import { state, saveSession, notify } from '../state.js';
import { el, showToast, getFooterHTML } from '../utils/helpers.js';

export function renderLogin(container) {
  container.innerHTML = '';

  const wrapper = el('div', { className: 'login-wrapper', style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } });
  const loginContainer = el('div', { className: 'login-container' });
  const box = el('div', { className: 'login-box login-box-unified' });

  box.innerHTML = `
    <!-- 1. 브랜드 헤더 (클릭 시 관리자 모드 시크릿 진입) -->
    <div class="login-brand-header" id="adminSecretTrigger" title="PAIR LOTTO" style="cursor: pointer; user-select: none;">
      <div class="login-logo">🎰</div>
      <h1 class="login-title" style="font-family: 'BcCardFont', sans-serif; font-weight: 700; font-size: 30px; margin-bottom: 4px;">PAIR LOTTO</h1>
      <p class="login-subtitle">시험기간 점수 예측 활동</p>
    </div>

    <!-- 2. 게임 설명 (학번/PIN 입력 전 먼저 읽도록 배치) -->
    <div class="login-guide-banner">
      <div class="guide-header">
        <span class="guide-badge">⚡ HOW TO PLAY</span>
        <span class="guide-title">PAIR LOTTO 진행 방식</span>
      </div>
      <div class="guide-steps-list">
        <div class="guide-step-item">
          <span class="step-num">1</span>
          <div class="step-detail">
            <strong>친구와 페어 맺기</strong>
            <p>공부 짝꿍과 과목별 목표 합산 점수(TARGET)를 정해 신청해요 (1인당 최대 2개 페어 가능)</p>
          </div>
        </div>
        <div class="guide-step-item">
          <span class="step-num">2</span>
          <div class="step-detail">
            <strong>퀘스트 인증 & 버프 UP</strong>
            <p>예상문제 공유, 오답정리 사진을 인증하면 당첨 오차 범위(BONUS)가 넓어져요</p>
          </div>
        </div>
        <div class="guide-step-item">
          <span class="step-num">3</span>
          <div class="step-detail">
            <strong>시험 후 로또 결과 오픈!</strong>
            <p>성적 발표 후 두 사람 점수 합계가 TARGET 범위에 들면 JACKPOT 당첨!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 접속 폼 (로그인 / PIN 설정) -->
    <div id="loginStep" class="login-form">
      <div class="form-group">
        <label class="form-label">학번 (4자리)</label>
        <input type="text" id="loginStudentNumber" class="form-input" placeholder="예: 2201" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">PIN (4자리)</label>
        <input type="password" id="loginPin" class="form-input" placeholder="PIN 입력" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <button id="loginBtn" class="btn btn-gold btn-lg btn-wide">로그인</button>
    </div>

    <div class="login-divider">또는</div>

    <div class="login-form">
      <button id="setupBtn" class="btn btn-ghost btn-wide">처음이에요 (PIN 설정)</button>
    </div>

    <div id="setupStep" class="login-form hidden">
      <div class="form-group">
        <label class="form-label">학번 (4자리)</label>
        <input type="text" id="setupStudentNumber" class="form-input" placeholder="예: 2201" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">이름</label>
        <input type="text" id="setupStudentName" class="form-input" placeholder="이름 입력" />
      </div>
      <div class="form-group">
        <label class="form-label">새 PIN (4자리 숫자)</label>
        <input type="password" id="setupPin" class="form-input" placeholder="PIN 설정" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">PIN 확인</label>
        <input type="password" id="setupPinConfirm" class="form-input" placeholder="PIN 다시 입력" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <button id="setupSubmitBtn" class="btn btn-primary btn-lg btn-wide">PIN 설정하고 시작</button>
      <button id="setupBackBtn" class="btn btn-ghost btn-wide">돌아가기</button>
    </div>
  `;

  loginContainer.appendChild(box);
  wrapper.appendChild(loginContainer);

  const footerWrapper = document.createElement('div');
  footerWrapper.innerHTML = getFooterHTML();
  wrapper.appendChild(footerWrapper.firstElementChild);

  container.appendChild(wrapper);

  // --- 이벤트 연결 ---
  const loginStep = box.querySelector('#loginStep');
  const setupStep = box.querySelector('#setupStep');

  // 관리자 시크릿 진입 (PAIR LOTTO 로고/제목 클릭)
  box.querySelector('#adminSecretTrigger').addEventListener('click', () => {
    state.currentView = 'admin-login';
    notify();
  });

  // 처음이에요 버튼
  box.querySelector('#setupBtn').addEventListener('click', () => {
    loginStep.classList.add('hidden');
    box.querySelector('.login-divider').classList.add('hidden');
    box.querySelector('#setupBtn').parentElement.classList.add('hidden');
    setupStep.classList.remove('hidden');
  });

  // 돌아가기
  box.querySelector('#setupBackBtn').addEventListener('click', () => {
    loginStep.classList.remove('hidden');
    box.querySelector('.login-divider').classList.remove('hidden');
    box.querySelector('#setupBtn').parentElement.classList.remove('hidden');
    setupStep.classList.add('hidden');
  });

  // 로그인 처리
  box.querySelector('#loginBtn').addEventListener('click', handleLogin);
  box.querySelector('#loginPin').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // PIN 설정 처리
  box.querySelector('#setupSubmitBtn').addEventListener('click', handleSetup);
}

async function handleLogin() {
  const studentNumber = document.getElementById('loginStudentNumber').value.trim();
  const pin = document.getElementById('loginPin').value.trim();

  if (!studentNumber || studentNumber.length !== 4) {
    showToast('학번 4자리를 입력해주세요.', 'error');
    return;
  }
  if (!pin || pin.length !== 4) {
    showToast('PIN 4자리를 입력해주세요.', 'error');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = '로그인 중...';

  try {
    const result = await api.loginStudent(studentNumber, pin);
    if (result.ok && result.student) {
      saveSession(result.student);
      state.currentView = 'student';
      showToast(`${result.student.studentName}님 환영합니다!`, 'success');
      notify();
    }
  } catch (err) {
    showToast(err.message || '로그인에 실패했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '로그인';
  }
}

async function handleSetup() {
  const studentNumber = document.getElementById('setupStudentNumber').value.trim();
  const studentName = document.getElementById('setupStudentName').value.trim();
  const pin = document.getElementById('setupPin').value.trim();
  const pinConfirm = document.getElementById('setupPinConfirm').value.trim();

  if (!studentNumber || studentNumber.length !== 4) {
    showToast('학번 4자리를 입력해주세요.', 'error');
    return;
  }
  if (!studentName) {
    showToast('이름을 입력해주세요.', 'error');
    return;
  }
  if (!pin || pin.length !== 4) {
    showToast('PIN 4자리를 입력해주세요.', 'error');
    return;
  }
  if (pin !== pinConfirm) {
    showToast('PIN이 일치하지 않습니다.', 'error');
    return;
  }

  const btn = document.getElementById('setupSubmitBtn');
  btn.disabled = true;
  btn.textContent = '설정 중...';

  try {
    const result = await api.setupPin(studentNumber, studentName, pin);
    if (result.ok && result.student) {
      saveSession(result.student);
      state.currentView = 'student';
      showToast('PIN이 설정되었습니다!', 'success');
      notify();
    }
  } catch (err) {
    showToast(err.message || 'PIN 설정에 실패했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'PIN 설정하고 시작';
  }
}
