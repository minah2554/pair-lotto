/**
 * 학생 로그인 화면
 * 학번 선택 + PIN 입력 방식
 */
import { api } from '../services/index.js';
import { state, saveSession, notify } from '../state.js';
import { el, showToast, getFooterHTML } from '../utils/helpers.js';
import { TEXTS } from '../texts.js';

export function renderLogin(container) {
  container.innerHTML = '';

  const wrapper = el('div', { className: 'login-wrapper', style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } });
  const loginContainer = el('div', { className: 'login-container' });
  const box = el('div', { className: 'login-box login-box-unified' });

  box.innerHTML = `
    <!-- 1. 브랜드 헤더 (타이틀 클릭 시 관리자 모드 시크릿 진입) -->
    <div class="login-brand-header">
      <div class="login-logo">
        <img src="/logo-lotto.svg" alt="PAIR LOTTO 로고" style="width: 64px; height: 64px; object-fit: contain;" />
      </div>
      <h1 class="login-title" id="board-title" style="font-family: 'BcCardFont', sans-serif; font-weight: 700; font-size: 32px; margin-bottom: 2px; cursor: pointer; user-select: none;" title="${TEXTS.brand.appTitle}">${TEXTS.brand.appTitle}</h1>
      <p class="login-subtitle">${TEXTS.brand.appSubtitle}</p>
    </div>

    <!-- 2. 게임 설명 (학번/PIN 입력 전 먼저 읽도록 배치) -->
    <div class="login-guide-banner">
      <div class="guide-header">
        <span class="guide-badge">${TEXTS.login.howToPlayBadge}</span>
        <span class="guide-title">${TEXTS.login.howToPlayTitle}</span>
      </div>
      <div class="guide-steps-list">
        <div class="guide-step-item">
          <span class="step-num">1</span>
          <div class="step-detail">
            <strong>${TEXTS.login.step1Title}</strong>
            <p>${TEXTS.login.step1Desc}</p>
          </div>
        </div>
        <div class="guide-step-item">
          <span class="step-num">2</span>
          <div class="step-detail">
            <strong>${TEXTS.login.step2Title}</strong>
            <p>${TEXTS.login.step2Desc}</p>
          </div>
        </div>
        <div class="guide-step-item">
          <span class="step-num">3</span>
          <div class="step-detail">
            <strong>${TEXTS.login.step3Title}</strong>
            <p>${TEXTS.login.step3Desc}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 접속 폼 (로그인 / 초기 비밀번호 설정) -->
    <div id="loginStep" class="login-form">
      <div class="form-group">
        <label class="form-label">${TEXTS.login.studentNumberLabel}</label>
        <input type="text" id="loginStudentNumber" class="form-input" placeholder="${TEXTS.login.studentNumberPlaceholder}" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">${TEXTS.login.pinLabel}</label>
        <input type="password" id="loginPin" class="form-input" placeholder="${TEXTS.login.pinPlaceholder}" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <button id="loginBtn" class="btn btn-gold btn-lg btn-wide">${TEXTS.login.loginButton}</button>
    </div>

    <div class="login-divider">또는</div>

    <div class="login-form">
      <button id="setupBtn" class="btn btn-ghost btn-wide">${TEXTS.login.firstTimeButton}</button>
    </div>

    <div id="setupStep" class="login-form hidden">
      <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); border-radius:10px; padding:10px 12px; margin-bottom:12px;">
        <div style="color:var(--gold); font-weight:800; font-size:13px; margin-bottom:2px;">${TEXTS.login.setupGuideTitle}</div>
        <div style="color:var(--text); font-size:11.5px; line-height:1.45;">
          ${TEXTS.login.setupGuideText}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${TEXTS.login.studentNumberLabel}</label>
        <input type="text" id="setupStudentNumber" class="form-input" placeholder="${TEXTS.login.studentNumberPlaceholder}" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">${TEXTS.login.nameLabel}</label>
        <input type="text" id="setupStudentName" class="form-input" placeholder="${TEXTS.login.namePlaceholder}" />
      </div>
      <div class="form-group">
        <label class="form-label">${TEXTS.login.setupPinLabel}</label>
        <input type="password" id="setupPin" class="form-input" placeholder="비밀번호 4자리 설정" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group">
        <label class="form-label">${TEXTS.login.setupPinConfirmLabel}</label>
        <input type="password" id="setupPinConfirm" class="form-input" placeholder="비밀번호 다시 입력" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <button id="setupSubmitBtn" class="btn btn-primary btn-lg btn-wide">${TEXTS.login.setupSubmitButton}</button>
      <button id="setupBackBtn" class="btn btn-ghost btn-wide">${TEXTS.login.backToLoginButton}</button>
    </div>
  `;

  loginContainer.appendChild(box);
  wrapper.appendChild(loginContainer);

  const footerWrapper = document.createElement('div');
  footerWrapper.innerHTML = getFooterHTML();
  wrapper.appendChild(footerWrapper.firstElementChild);

  container.appendChild(wrapper);

  // 관리자 시크릿 진입 (PAIR LOTTO 메인 타이틀 클릭)
  const titleTrigger = box.querySelector('#board-title');
  if (titleTrigger) {
    titleTrigger.addEventListener('click', () => {
      state.currentView = 'admin-login';
      notify();
    });
  }

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
    showToast('비밀번호 4자리를 입력해주세요.', 'error');
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
    const msg = err.message || '로그인에 실패했습니다.';
    showToast(msg, 'error');
    if (msg.includes('초기 비밀번호') || msg.includes('처음이에요')) {
      const loginStep = document.getElementById('loginStep');
      const setupStep = document.getElementById('setupStep');
      const setupStudentNumber = document.getElementById('setupStudentNumber');
      const divider = document.querySelector('.login-divider');
      const setupBtnContainer = document.querySelector('#setupBtn')?.parentElement;
      if (loginStep && setupStep) {
        loginStep.classList.add('hidden');
        if (divider) divider.classList.add('hidden');
        if (setupBtnContainer) setupBtnContainer.classList.add('hidden');
        setupStep.classList.remove('hidden');
        if (setupStudentNumber) setupStudentNumber.value = studentNumber;
        document.getElementById('setupStudentName')?.focus();
      }
    }
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
    showToast('초기 비밀번호 4자리를 입력해주세요.', 'error');
    return;
  }
  if (pin !== pinConfirm) {
    showToast('비밀번호가 일치하지 않습니다.', 'error');
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
      showToast('초기 비밀번호가 설정되었습니다! 꼭 기억해주세요.', 'success');
      notify();
    }
  } catch (err) {
    showToast(err.message || '초기 비밀번호 설정에 실패했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'PIN 설정하고 시작';
  }
}
