/**
 * PAIR LOTTO 통합 API 서비스
 * API_URL이 설정되면 실제 Apps Script로, 없으면 데모 데이터로 동작합니다.
 */
import { API_URL } from '../config.js';
import { handleDemoApi } from './demoData.js';

/** API 호출 또는 데모 모드 자동 전환 */
async function callApi(action, params = {}) {
  // API URL이 없으면 데모 모드
  if (!API_URL) {
    // 네트워크 지연 시뮬레이션
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    const result = handleDemoApi(action, params);
    if (result.error) throw new Error(result.error);
    return result;
  }

  // 실제 API 호출
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('params', JSON.stringify(params));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error(`[API] ${action} 실패:`, err);
    throw err;
  }
}

async function callApiPost(action, payload = {}) {
  if (!API_URL) {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    const result = handleDemoApi(action, payload);
    if (result.error) throw new Error(result.error);
    return result;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error(`[API] POST ${action} 실패:`, err);
    throw err;
  }
}

// ==================== 공개 API 함수 ====================

export const api = {
  // 학생
  getStudents: () => callApi('getStudents'),
  getSubjects: () => callApi('getSubjects'),
  loginStudent: (studentNumber, pin) => callApiPost('loginStudent', { studentNumber, pin }),
  setupPin: (studentNumber, studentName, pin) => callApiPost('setupPin', { studentNumber, studentName, pin }),
  getStudentHome: (studentId) => callApi('getStudentHome', { studentId }),
  createPairRequest: (fromId, toId, subjectId, target) => callApiPost('createPairRequest', { fromId, toId, subjectId, target }),
  getReceivedRequests: (studentId) => callApi('getReceivedRequests', { studentId }),
  getSentRequests: (studentId) => callApi('getSentRequests', { studentId }),
  acceptPairRequest: (requestId, responderId) => callApiPost('acceptPairRequest', { requestId, responderId }),
  rejectPairRequest: (requestId, responderId) => callApiPost('rejectPairRequest', { requestId, responderId }),
  cancelPairRequest: (requestId, studentId) => callApiPost('cancelPairRequest', { requestId, studentId }),
  getMyPairs: (studentId) => callApi('getMyPairs', { studentId }),
  getMissions: () => callApi('getMissions'),
  getMissionStatus: (pairId) => callApi('getMissionStatus', { pairId }),
  submitMission: (pairId, subjectId, missionId, uploaderId, base64, mimeType, fileName) =>
    callApiPost('submitMission', { pairId, subjectId, missionId, uploaderId, base64, mimeType, fileName }),
  getStudentResults: (studentId) => callApi('getStudentResults', { studentId }),
  getApplicationStatus: () => callApi('getApplicationStatus'),

  // 관리자
  adminLogin: (password) => callApiPost('adminLogin', { password }),
  setGlobalApplicationStatus: (open) => callApiPost('setGlobalApplicationStatus', { open }),
  setSubjectApplicationStatus: (subjectId, open) => callApiPost('setSubjectApplicationStatus', { subjectId, open }),
  getAllPairs: () => callApi('getAllPairs'),
  getAllRequests: () => callApi('getAllRequests'),
  deletePair: (pairId) => callApiPost('deletePair', { pairId }),
  updatePairTarget: (pairId, newTarget) => callApiPost('updatePairTarget', { pairId, newTarget }),
  unlockStudentPair: (studentId, subjectId) => callApiPost('unlockStudentPair', { studentId, subjectId }),
  uploadStudents: (csvData) => callApiPost('uploadStudents', { csvData }),
  uploadSubjects: (subjects) => callApiPost('uploadSubjects', { subjects }),
  uploadExamResults: (data) => callApiPost('uploadExamResults', { data }),
  calculateResults: () => callApiPost('calculateResults'),
  getAllResults: () => callApi('getAllResults'),
  getDashboardStats: () => callApi('getDashboardStats'),
  getAllMissionSubmissions: () => callApi('getAllMissionSubmissions'),
  revokeMission: (submissionId) => callApiPost('revokeMission', { submissionId }),
  updateMissions: (missions) => callApiPost('updateMissions', { missions }),
  getSettings: () => callApi('getSettings'),
  updateSettings: (settings) => callApiPost('updateSettings', { settings }),
};
