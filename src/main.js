/**
 * PAIR LOTTO 메인 엔트리 포인트
 * 뷰 라우팅과 앱 초기화를 담당합니다.
 */
import './styles/index.css';
import { state, subscribe, restoreSession, restoreAdminSession, notify } from './state.js';
import { renderLogin } from './views/Login.js';
import { renderStudent, cleanupStudent } from './views/Student.js';
import { renderAdminLogin } from './views/AdminLogin.js';
import { renderAdmin } from './views/Admin.js';
import { API_URL } from './config.js';

const app = document.getElementById('app');

/** 뷰 라우팅 */
function render() {
  // 이전 뷰 정리
  cleanupStudent();

  switch (state.currentView) {
    case 'login':
      renderLogin(app);
      break;
    case 'student':
      renderStudent(app);
      break;
    case 'admin-login':
      renderAdminLogin(app);
      break;
    case 'admin':
      renderAdmin(app);
      break;
    default:
      renderLogin(app);
  }
}

/** 상태 변경 시 리렌더링 */
subscribe(render);

/** 앱 초기화 */
function init() {
  // 데모 모드 알림
  if (!API_URL) {
    console.log('%c[PAIR LOTTO] 데모 모드로 동작 중입니다. .env에 VITE_APPS_SCRIPT_API_URL을 설정하세요.', 'color: #f59e0b; font-weight: bold');
  }

  // 세션 복원
  const student = restoreSession();
  const isAdmin = restoreAdminSession();

  if (isAdmin) {
    state.currentView = 'admin';
  } else if (student) {
    state.currentView = 'student';
  } else {
    state.currentView = 'login';
  }

  render();
}

init();
