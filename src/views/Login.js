/**
 * 학생 로그인 화면
 * 학번(4자리) + 비밀번호(4자리) 간소화 로그인 방식
 * - 복잡한 초기 설정 절차 삭제
 * - 교사가 등록한 명단 기반 첫 로그인 시 입력한 비밀번호가 자동 저장됨
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

    <!-- 3. 간소화된 로그인 폼 -->
    <div id="loginStep" class="login-form">
      <div class="form-group">
        <label class="form-label">${TEXTS.login.studentNumberLabel}</label>
        <input type="text" id="loginStudentNumber" class="form-input" placeholder="${TEXTS.login.studentNumberPlaceholder}" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
      </div>
      <div class="form-group" style="margin-bottom: 18px;">
        <label class="form-label">${TEXTS.login.pinLabel}</label>
        <input type="password" id="loginPin" class="form-input" placeholder="${TEXTS.login.pinPlaceholder}" maxlength="4" inputmode="numeric" pattern="[0-9]*" />
        <p class="pin-first-time-notice" style="color: var(--gold); font-size: 12px; margin-top: 6px; line-height: 1.45; font-weight: 600; word-break: keep-all;">
          ${TEXTS.login.pinNotice || '※ 첫 로그인 시 입력한 비밀번호가 저장됩니다. 꼭 기억하세요!'}
        </p>
      </div>
      <button id="loginBtn" class="btn btn-gold btn-lg btn-wide" style="font-weight: 800; font-size: 16px;">${TEXTS.login.loginButton}</button>
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

  // 로그인 이벤트 연결
  box.querySelector('#loginBtn').addEventListener('click', handleLogin);
  box.querySelector('#loginPin').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  box.querySelector('#loginStudentNumber').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('loginPin')?.focus();
    }
  });
}

async function handleLogin() {
  const studentNumber = document.getElementById('loginStudentNumber')?.value.trim();
  const pin = document.getElementById('loginPin')?.value.trim();

  if (!studentNumber || studentNumber.length !== 4) {
    showToast('학번 4자리를 입력해주세요.', 'error');
    document.getElementById('loginStudentNumber')?.focus();
    return;
  }
  if (!pin || pin.length !== 4) {
    showToast('비밀번호 4자리를 입력해주세요.', 'error');
    document.getElementById('loginPin')?.focus();
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
      if (result.isFirstLogin) {
        showToast(`🎉 비밀번호가 저장되었습니다! ${result.student.studentName}님 환영합니다!`, 'success');
      } else {
        showToast(`${result.student.studentName}님 환영합니다!`, 'success');
      }
      notify();
    }
  } catch (err) {
    const msg = err.message || '로그인에 실패했습니다.';
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '로그인';
  }
}
