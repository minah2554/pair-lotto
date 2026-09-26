/**
 * PAIR LOTTO API 서비스
 * 모든 Apps Script API 호출을 이 파일에서 관리합니다.
 * API_URL이 변경되어도 이 파일 하나만 수정하면 됩니다.
 */
import { API_URL } from '../config.js';

/**
 * Apps Script Web App에 요청을 보내는 공통 함수
 * CORS 이슈 방지를 위해 JSONP 방식 또는 fetch no-cors 모드를 사용합니다.
 * Apps Script의 doGet/doPost는 redirect를 수행하므로 이를 처리합니다.
 */
async function callApi(action, params = {}) {
  if (!API_URL) {
    console.warn('[API] API_URL이 설정되지 않았습니다. 데모 모드로 동작합니다.');
    return null;
  }

  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  // GET 파라미터로 JSON을 전달
  url.searchParams.set('params', JSON.stringify(params));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (err) {
    console.error(`[API] ${action} 실패:`, err);
    throw err;
  }
}

/**
 * POST 방식 API 호출 (데이터 변경 작업용)
 * Apps Script doPost로 요청합니다.
 */
async function callApiPost(action, payload = {}) {
  if (!API_URL) {
    console.warn('[API] API_URL이 설정되지 않았습니다. 데모 모드로 동작합니다.');
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (err) {
    console.error(`[API] POST ${action} 실패:`, err);
    throw err;
  }
}

// ==================== 학생 API ====================

/** 학생 목록 조회 */
export function getStudents() {
  return callApi('getStudents');
}

/** 과목 목록 조회 */
export function getSubjects() {
  return callApi('getSubjects');
}

/** 학생 로그인 (학번 + PIN 검증) */
export function loginStudent(studentNumber, pin) {
  return callApiPost('loginStudent', { studentNumber, pin });
}

/** 학생 PIN 최초 설정 */
export function setupPin(studentNumber, studentName, pin) {
  return callApiPost('setupPin', { studentNumber, studentName, pin });
}

/** 관리자: 학생 PIN 변경/재설정 */
export function updateStudentPin(studentId, newPin, studentNumber = '') {
  return callApiPost('updateStudentPin', { studentId, newPin, studentNumber });
}

/** PAIR 신청 보내기 */
export function createPairRequest(fromId, toId, subjectId, target) {
  return callApiPost('createPairRequest', { fromId, toId, subjectId, target });
}

/** 받은 PAIR 신청 목록 조회 */
export function getReceivedRequests(studentId) {
  return callApi('getReceivedRequests', { studentId });
}

/** 보낸 PAIR 신청 목록 조회 */
export function getSentRequests(studentId) {
  return callApi('getSentRequests', { studentId });
}

/** PAIR 신청 수락 */
export function acceptPairRequest(requestId, responderId) {
  return callApiPost('acceptPairRequest', { requestId, responderId });
}

/** PAIR 신청 거절 */
export function rejectPairRequest(requestId, responderId) {
  return callApiPost('rejectPairRequest', { requestId, responderId });
}

/** PAIR 신청 취소 (신청자가) */
export function cancelPairRequest(requestId, studentId) {
  return callApiPost('cancelPairRequest', { requestId, studentId });
}

/** 성사된 PAIR 끊기 / 해제 (신청 변경 기간 동안 가능) */
export function cancelPair(pairId, studentId) {
  return callApiPost('cancelPair', { pairId, studentId });
}

/** 내 PAIR 현황 조회 */
export function getMyPairs(studentId) {
  return callApi('getMyPairs', { studentId });
}

/** 응모 상태 조회 (전체 + 과목별 OPEN/CLOSE) */
export function getApplicationStatus() {
  return callApi('getApplicationStatus');
}

/** 미션 목록 조회 */
export function getMissions() {
  return callApi('getMissions');
}

/** 미션 제출 현황 조회 */
export function getMissionStatus(pairId) {
  return callApi('getMissionStatus', { pairId });
}

/** 미션 사진 제출 */
export function submitMission(pairId, subjectId, missionId, uploaderId, base64, mimeType, fileName) {
  return callApiPost('submitMission', {
    pairId, subjectId, missionId, uploaderId, base64, mimeType, fileName
  });
}

/** 학생 결과 조회 */
export function getStudentResults(studentId) {
  return callApi('getStudentResults', { studentId });
}

/** 학생 홈 전체 데이터 조회 (polling 최적화) */
export function getStudentHome(studentId) {
  return callApi('getStudentHome', { studentId });
}

// ==================== 관리자 API ====================

/** 관리자 로그인 */
export function adminLogin(password) {
  return callApiPost('adminLogin', { password });
}

/** 전체 응모 OPEN/CLOSE 설정 */
export function setGlobalApplicationStatus(open) {
  return callApiPost('setGlobalApplicationStatus', { open });
}

/** 과목별 응모 OPEN/CLOSE 설정 */
export function setSubjectApplicationStatus(subjectId, open) {
  return callApiPost('setSubjectApplicationStatus', { subjectId, open });
}

/** 전체 PAIR 현황 조회 */
export function getAllPairs() {
  return callApi('getAllPairs');
}

/** 전체 PAIR 신청 조회 */
export function getAllRequests() {
  return callApi('getAllRequests');
}

/** PAIR 삭제 (관리자) */
export function deletePair(pairId) {
  return callApiPost('deletePair', { pairId });
}

/** PAIR TARGET 수정 (관리자) */
export function updatePairTarget(pairId, newTarget) {
  return callApiPost('updatePairTarget', { pairId, newTarget });
}

/** 특정 학생 재응모 허용 (관리자) */
export function unlockStudentPair(studentId, subjectId) {
  return callApiPost('unlockStudentPair', { studentId, subjectId });
}

/** 학생 목록 CSV 업로드 */
export function uploadStudents(csvData) {
  return callApiPost('uploadStudents', { csvData });
}

/** 과목 목록 업로드 */
export function uploadSubjects(subjects) {
  return callApiPost('uploadSubjects', { subjects });
}

/** 관리자: 미응모 학생 자동 매칭 미리보기 */
export function previewAutoMatch() {
  return callApiPost('previewAutoMatch');
}

/** 관리자: 교사가 확정한 자동 매칭 페어 목록 일괄 저장 */
export function saveAutoMatchedPairs(pairs) {
  return callApiPost('saveAutoMatchedPairs', { pairs });
}

/** 시험 점수 업로드 */
export function uploadExamResults(data) {
  return callApiPost('uploadExamResults', { data });
}

/** 결과 자동 판정 실행 */
export function calculateResults() {
  return callApiPost('calculateResults');
}

/** 전체 결과 조회 */
export function getAllResults() {
  return callApi('getAllResults');
}

/** 대시보드 통계 조회 */
export function getDashboardStats() {
  return callApi('getDashboardStats');
}

/** 미션 인증 목록 조회 (관리자) */
export function getAllMissionSubmissions() {
  return callApi('getAllMissionSubmissions');
}

/** 미션 인증 취소 (관리자) */
export function revokeMission(submissionId) {
  return callApiPost('revokeMission', { submissionId });
}

/** 미션 목록 설정 (관리자) */
export function updateMissions(missions) {
  return callApiPost('updateMissions', { missions });
}

/** 설정값 조회 */
export function getSettings() {
  return callApi('getSettings');
}

/** 설정값 저장 */
export function updateSettings(settings) {
  return callApiPost('updateSettings', { settings });
}
