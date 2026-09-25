/**
 * PAIR LOTTO 상태 관리
 * 앱 전체 상태를 관리합니다.
 * 학생 세션 정보는 localStorage에 저장합니다.
 */

const SESSION_KEY = 'pairlotto_session';
const ADMIN_SESSION_KEY = 'pairlotto_admin';

/** 앱 전역 상태 */
export const state = {
  // 현재 뷰: 'login' | 'student' | 'admin-login' | 'admin'
  currentView: 'login',

  // 학생 세션
  student: null, // { studentId, studentNumber, studentName, classId }

  // 관리자 인증 여부
  adminAuthenticated: false,

  // 학생 목록 (캐시)
  students: [],

  // 과목 목록 (캐시)
  subjects: [],

  // 응모 상태 { globalOpen: bool, subjects: { subjectId: bool } }
  applicationStatus: { globalOpen: true, subjects: {} },

  // 받은 신청 목록
  receivedRequests: [],

  // 보낸 신청 목록
  sentRequests: [],

  // 내 PAIR 목록
  myPairs: [],

  // 미션 목록
  missions: [],

  // 미션 제출 현황 { pairId: { missionId: submission } }
  missionSubmissions: {},

  // 결과 데이터
  results: [],

  // 관리자 대시보드 데이터
  dashboard: null,

  // Polling 타이머 ID
  pollTimer: null,
};

/** 상태 변경 리스너 */
const listeners = new Set();

/** 상태 변경 알림 */
export function notify() {
  listeners.forEach(fn => fn(state));
}

/** 리스너 등록 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 학생 세션 저장 */
export function saveSession(student) {
  state.student = student;
  localStorage.setItem(SESSION_KEY, JSON.stringify(student));
}

/** 학생 세션 복원 */
export function restoreSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (data) {
      state.student = JSON.parse(data);
      return state.student;
    }
  } catch (e) { /* ignore */ }
  return null;
}

/** 학생 세션 삭제 */
export function clearSession() {
  state.student = null;
  localStorage.removeItem(SESSION_KEY);
}

/** 관리자 세션 저장 */
export function saveAdminSession() {
  state.adminAuthenticated = true;
  sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
}

/** 관리자 세션 복원 */
export function restoreAdminSession() {
  state.adminAuthenticated = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  return state.adminAuthenticated;
}

/** 관리자 세션 삭제 */
export function clearAdminSession() {
  state.adminAuthenticated = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
