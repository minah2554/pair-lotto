/**
 * 관리자 로그인 화면
 */
import { api } from '../services/index.js';
import { state, saveAdminSession, notify } from '../state.js';
import { el, showToast } from '../utils/helpers.js';

export function renderAdminLogin(container) {
  container.innerHTML = '';

  const loginContainer = el('div', { className: 'login-container' });
  const box = el('div', { className: 'login-box' });

  box.innerHTML = `
    <div class="login-logo">🔐</div>
    <h1 class="login-title">관리자 모드</h1>
    <p class="login-subtitle">PAIR LOTTO 운영 관리</p>

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
  container.appendChild(loginContainer);

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
  const password = document.getElementById('adminPassword').value;
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'error');
    return;
  }

  const btn = document.getElementById('adminLoginBtn');
  btn.disabled = true;
  btn.textContent = '로그인 중...';

  try {
    const result = await api.adminLogin(password);
    if (result.ok) {
      saveAdminSession();
      state.currentView = 'admin';
      showToast('관리자 모드로 진입했습니다.', 'success');
      notify();
    }
  } catch (err) {
    showToast(err.message || '로그인에 실패했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '로그인';
  }
}
