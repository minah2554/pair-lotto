/**
 * 관리자 로그인 화면
 */
import { api } from '../services/index.js';
import { state, saveAdminSession, notify } from '../state.js';
import { el, showToast, getFooterHTML, sha256 } from '../utils/helpers.js';

export function renderAdminLogin(container) {
  container.innerHTML = '';

  const wrapper = el('div', { className: 'login-wrapper', style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } });
  const loginContainer = el('div', { className: 'login-container' });
  const box = el('div', { className: 'login-box' });

  box.innerHTML = `
    <div class="login-logo">
      <img src="/logo-lotto.svg" alt="PAIR LOTTO 로고" style="width: 48px; height: 48px; object-fit: contain;" />
    </div>
    <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
      <img src="/logo-lotto.svg" alt="로고" style="width: 24px; height: 24px; object-fit: contain; vertical-align: middle;" />
      <h1 class="login-title" id="admin-board-title" style="font-family: 'BcCardFont', sans-serif; font-weight: 700; font-size: 28px; margin-bottom: 0; display: inline-block;">관리자 모드</h1>
    </div>
    <p class="login-subtitle" style="margin-top: 6px;">PAIR LOTTO 운영 관리</p>

    <div class="login-form">
      <div class="form-group">
        <label class="form-label">관리자 비밀번호</label>
        <input type="password" id="adminPassword" class="form-input" placeholder="비밀번호 입력" />
      </div>
      <button id="adminLoginBtn" class="btn btn-primary btn-lg btn-wide">로그인</button>
    </div>

    <div class="login-footer mt-2">
      <a id="backToStudentLink">학생 모드로 돌아가기</a>
    </div>
  `;

  loginContainer.appendChild(box);
  wrapper.appendChild(loginContainer);

  const footerWrapper = document.createElement('div');
  footerWrapper.innerHTML = getFooterHTML();
  wrapper.appendChild(footerWrapper.firstElementChild);

  container.appendChild(wrapper);

  // 이벤트
  box.querySelector('#adminLoginBtn').addEventListener('click', handleAdminLogin);
  box.querySelector('#adminPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  });
  box.querySelector('#backToStudentLink').addEventListener('click', () => {
    state.currentView = 'login';
    notify();
  });
}

async function handleAdminLogin() {
  const password = document.getElementById('adminPassword').value.trim();
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'error');
    return;
  }

  const btn = document.getElementById('adminLoginBtn');
  btn.disabled = true;
  btn.textContent = '로그인 중...';

  try {
    const passwordHash = await sha256(password);
    const passwordHashLower = await sha256(password.toLowerCase());

    // minah의 실제 SHA-256 해시 및 검증
    const VALID_HASHES = [
      'ad5f52f58ed6ec6e7a641f2416f347674ac5933470079f2a18bc6269b1e80796', // sha256('minah')
      'e90f23b2bfa9a6dd6313364fa4e6777c98c0b533cb1b0fa3f6ce4048cfc526be'
    ];

    // 즉시 SHA-256 해시 검증
    if (VALID_HASHES.includes(passwordHash) || VALID_HASHES.includes(passwordHashLower)) {
      saveAdminSession();
      state.currentView = 'admin';
      showToast('관리자 모드로 진입했습니다.', 'success');
      notify();
      return;
    }

    // 서버 추가 검증
    const result = await api.adminLogin(passwordHashLower);
    if (result && result.ok) {
      saveAdminSession();
      state.currentView = 'admin';
      showToast('관리자 모드로 진입했습니다.', 'success');
      notify();
    } else {
      showToast('비밀번호가 올바르지 않습니다.', 'error');
    }
  } catch (err) {
    showToast('비밀번호가 올바르지 않습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '로그인';
  }
}
