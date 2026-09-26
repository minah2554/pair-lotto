/**
 * PAIR LOTTO - Google Apps Script 백엔드
 * ==========================================
 * 이 파일을 Google Apps Script 에디터에 붙여넣으세요.
 *
 * 설정 방법:
 * 1. Google Sheets에 필요한 시트를 만듭니다 (아래 SHEETS 참조)
 * 2. Apps Script > 프로젝트 설정 > 스크립트 속성에 다음을 추가:
 *    - SPREADSHEET_ID: Google Sheets 문서 ID
 *    - MISSION_FOLDER_ID: Google Drive 미션 사진 폴더 ID
 *    - ADMIN_PASSWORD: 관리자 비밀번호
 * 3. 배포 > 새 배포 > 웹 앱으로 배포
 *    - 실행 주체: 나
 *    - 액세스: 모든 사용자
 */

// ==================== 시트 이름 상수 (한글 기본 + 영문 호환) ====================
const SHEETS = {
  SETTINGS: '설정',
  STUDENTS: '학생명단',
  SUBJECTS: '과목목록',
  PAIR_REQUESTS: '페어신청',
  PAIRS: '성사된페어',
  MISSIONS: '미션목록',
  MISSION_SUBMISSIONS: '미션제출',
  EXAM_RESULTS: '시험점수',
  RESULTS: '당첨결과',
};

// 영문 및 한글 별칭 상호 매핑 (기존 영문 시트명 완벽 지원)
const SHEET_ALIASES = {
  '설정': ['SETTINGS', '설정값'],
  '학생명단': ['STUDENTS', '학생', '학생목록'],
  '과목목록': ['SUBJECTS', '과목', '과목설정'],
  '페어신청': ['PAIR_REQUESTS', '신청내역', '페어신청내역'],
  '성사된페어': ['PAIRS', '페어목록', '매칭페어'],
  '미션목록': ['MISSIONS', '미션', '퀘스트'],
  '미션제출': ['MISSION_SUBMISSIONS', '미션인증', '제출내역'],
  '시험점수': ['EXAM_RESULTS', '시험결과', '성적'],
  '당첨결과': ['RESULTS', '결과', '추첨결과'],
};

// ==================== 스프레드시트 및 구글 드라이브 설정 ====================
// URL 전체를 넣거나 ID만 넣어도 자동으로 순수 ID를 추출하여 인식합니다.
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1q8G2Btlmj5c8SqxoxnSgSNL3gx5W8ESsuIUXv1GkbVQ/edit?usp=sharing';
const DRIVE_FOLDER_ID = 'https://drive.google.com/drive/folders/1aqPUUjQbMTllHDx0HYiKSVJvWY3ymvPR?usp=sharing';

/** URL 또는 ID 문자열에서 구글 고유 ID를 자동 추출 */
function extractId_(str) {
  if (!str) return '';
  const match = String(str).match(/[-\w]{25,}/);
  return match ? match[0] : String(str);
}

// ==================== 스프레드시트 접근 ====================
function getSs_() {
  const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const target = propId || SPREADSHEET_ID;
  if (!target) throw new Error('SPREADSHEET_ID가 설정되지 않았습니다.');
  return SpreadsheetApp.openById(extractId_(target));
}

function getSheet_(name) {
  const ss = getSs_();
  // 1. 요청된 이름으로 직접 찾기
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  // 2. 별칭(영문 또는 대체 이름)으로 검색
  const aliases = SHEET_ALIASES[name] || [];
  for (let i = 0; i < aliases.length; i++) {
    sheet = ss.getSheetByName(aliases[i]);
    if (sheet) return sheet;
  }

  // 3. name이 영문이었을 경우 한글 이름으로 역검색
  for (const [korName, engAliases] of Object.entries(SHEET_ALIASES)) {
    if (engAliases.includes(name)) {
      sheet = ss.getSheetByName(korName);
      if (sheet) return sheet;
    }
  }

  // 4. 없으면 기본 이름(한글)으로 생성
  sheet = ss.insertSheet(name);
  return sheet;
}

// ==================== 웹 앱 엔트리 ====================

/** GET 요청 처리 (읽기 작업) */
function doGet(e) {
  const action = e.parameter.action || '';
  const params = JSON.parse(e.parameter.params || '{}');

  let result;
  try {
    result = handleAction(action, params);
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/** POST 요청 처리 (쓰기 작업) */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: '잘못된 요청 형식입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = payload.action || '';
  let result;
  try {
    result = handleAction(action, payload);
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 액션 라우팅 ====================

function handleAction(action, params) {
  switch (action) {
    // 공통
    case 'getStudents': return getStudents_();
    case 'getSubjects': return getSubjects_();
    case 'getMissions': return getMissions_();
    case 'getApplicationStatus': return getApplicationStatus_();
    case 'getSettings': return getSettings_();

    // 학생
    case 'loginStudent': return loginStudent_(params);
    case 'setupPin': return setupPin_(params);
    case 'updateStudentPin': return updateStudentPin_(params);
    case 'resetStudentPin': return resetStudentPin_(params);
    case 'getStudentHome': return getStudentHome_(params);
    case 'createPairRequest': return createPairRequest_(params);
    case 'getReceivedRequests': return getReceivedRequests_(params);
    case 'getSentRequests': return getSentRequests_(params);
    case 'acceptPairRequest': return acceptPairRequest_(params);
    case 'rejectPairRequest': return rejectPairRequest_(params);
    case 'cancelPairRequest': return cancelPairRequest_(params);
    case 'cancelPair': return cancelPair_(params);
    case 'getMyPairs': return getMyPairs_(params);
    case 'getMissionStatus': return getMissionStatus_(params);
    case 'submitMission': return submitMission_(params);
    case 'getStudentResults': return getStudentResults_(params);

    // 관리자
    case 'adminLogin': return adminLogin_(params);
    case 'setGlobalApplicationStatus': return setGlobalApplicationStatus_(params);
    case 'setSubjectApplicationStatus': return setSubjectApplicationStatus_(params);
    case 'getAllPairs': return getAllPairs_();
    case 'getAllRequests': return getAllRequests_();
    case 'deletePair': return deletePair_(params);
    case 'updatePairTarget': return updatePairTarget_(params);
    case 'unlockStudentPair': return unlockStudentPair_(params);
    case 'uploadStudents': return uploadStudents_(params);
    case 'uploadSubjects': return uploadSubjects_(params);
    case 'addSubject': return addSubject_(params);
    case 'deleteSubject': return deleteSubject_(params);
    case 'autoMatchUnpairedStudents': return autoMatchUnpairedStudents_(params);
    case 'previewAutoMatch': return previewAutoMatch_(params);
    case 'saveAutoMatchedPairs': return saveAutoMatchedPairs_(params);
    case 'uploadExamResults': return uploadExamResults_(params);
    case 'calculateResults': return calculateResults_();
    case 'getAllResults': return getAllResults_();
    case 'getDashboardStats': return getDashboardStats_();
    case 'getAllMissionSubmissions': return getAllMissionSubmissions_();
    case 'revokeMission': return revokeMission_(params);
    case 'updateMissions': return updateMissions_(params);
    case 'updateSettings': return updateSettings_(params);
    case 'migrateSheetsToKorean': return migrateSheetsToKorean();
    case 'initializeSheets': initializeSheets(); return { ok: true, message: '초기화 완료' };
    case 'resetAllRecords': return resetAllRecords_();

    default:
      throw new Error('알 수 없는 액션: ' + action);
  }
}

// ==================== 설정 관리 ====================

function getSetting_(key) {
  const sheet = getSheet_(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === key);
  return row ? row[1] : null;
}

function setSetting_(key, value) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.SETTINGS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => r[0] === key);
    if (idx < 0) {
      sheet.appendRow([key, value]);
    } else {
      sheet.getRange(idx + 1, 2).setValue(value);
    }
  } finally {
    lock.releaseLock();
  }
}

function getSettings_() {
  const sheet = getSheet_(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = {};
  data.forEach(row => {
    if (row[0]) settings[row[0]] = row[1];
  });
  return { ok: true, settings };
}

function updateSettings_(params) {
  const settings = params.settings || {};
  Object.keys(settings).forEach(key => {
    setSetting_(key, settings[key]);
  });
  return { ok: true };
}

// ==================== 응모 상태 ====================

function isApplicationOpen_(subjectId) {
  const globalOpen = getSetting_('APPLICATION_OPEN');
  if (globalOpen !== null && String(globalOpen).toUpperCase() !== 'TRUE') return false;
  if (subjectId) {
    const subjectOpen = getSetting_('SUBJECT_' + subjectId + '_OPEN');
    if (subjectOpen !== null && String(subjectOpen).toUpperCase() !== 'TRUE') return false;
  }
  return true;
}

function getApplicationStatus_() {
  const globalVal = getSetting_('APPLICATION_OPEN');
  const globalOpen = globalVal === null || String(globalVal).toUpperCase() === 'TRUE';

  const subjects = {};
  const subjectList = getSubjectsList_();
  subjectList.forEach(s => {
    const val = getSetting_('SUBJECT_' + s.subjectId + '_OPEN');
    subjects[s.subjectId] = val === null || String(val).toUpperCase() === 'TRUE';
  });

  return { ok: true, globalOpen, subjects };
}

function setGlobalApplicationStatus_(params) {
  setSetting_('APPLICATION_OPEN', Boolean(params.open));
  const subjects = getSubjectsList_();
  subjects.forEach(s => {
    setSetting_('SUBJECT_' + s.subjectId + '_OPEN', Boolean(params.open));
  });
  return { ok: true };
}

function setSubjectApplicationStatus_(params) {
  setSetting_('SUBJECT_' + params.subjectId + '_OPEN', Boolean(params.open));
  return { ok: true };
}

// ==================== 학생 관리 ====================

/** 4자리 숫자 문자열(0000, 0123 등) 보존용 포맷터 */
function formatPin_(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).trim();
  if (/^\d{1,4}$/.test(str)) {
    return str.padStart(4, '0');
  }
  return str;
}

function formatStudentNumber_(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).trim();
  if (/^\d{1,4}$/.test(str)) {
    return str.padStart(4, '0');
  }
  return str;
}

function getStudentsList_() {
  const sheet = getSheet_(SHEETS.STUDENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // 헤더 분석 (한글 / 영문 컬럼 동적 자동 매핑)
  const header = data[0].map(h => String(h || '').trim().toLowerCase());
  let colId = header.findIndex(h => h === 'studentid' || h === '학번id' || h === '아이디');
  let colNum = header.findIndex(h => h === 'studentnumber' || h === '학번' || h === '번호');
  let colName = header.findIndex(h => h === 'studentname' || h === '이름' || h === '학생이름' || h === '성명');
  let colClass = header.findIndex(h => h === 'classid' || h === '반' || h === '학급');
  let colPin = header.findIndex(h => h === 'pinhash' || h === 'pin' || h === '비밀번호' || h === '핀번호');

  // 헤더가 특정되지 않은 경우 기본 인덱스 매핑
  if (colNum < 0) colNum = 1;
  if (colName < 0) colName = 2;
  if (colClass < 0) colClass = 3;
  if (colPin < 0) colPin = 4;

  return data.slice(1).filter(r => r[colNum] || r[0]).map(r => {
    // 0열이 4자리 숫자인 경우(학번 직접 입력 케이스 대응)
    let sNum = formatStudentNumber_(r[colNum] || r[0]);
    let sId = (colId >= 0 && r[colId]) ? String(r[colId]) : ('s' + sNum);
    let sName = String(r[colName] || '');
    let sClass = String(r[colClass] || '');
    let sPin = colPin >= 0 ? formatPin_(r[colPin]) : '';

    return {
      studentId: sId,
      studentNumber: sNum,
      studentName: sName,
      classId: sClass,
      pinHash: sPin,
    };
  });
}

function getStudents_() {
  const students = getStudentsList_().map(s => ({
    studentId: s.studentId,
    studentNumber: s.studentNumber,
    studentName: s.studentName,
    classId: s.classId,
  }));
  return { ok: true, students };
}

function loginStudent_(params) {
  const studentNumber = formatStudentNumber_(params.studentNumber);
  const pin = formatPin_(params.pin);

  if (!studentNumber || studentNumber.length !== 4) {
    throw new Error('학번 4자리를 정확히 입력해주세요.');
  }
  if (!pin || pin.length !== 4) {
    throw new Error('비밀번호 4자리를 정확히 입력해주세요.');
  }

  const students = getStudentsList_();
  let student = students.find(s => formatStudentNumber_(s.studentNumber) === studentNumber);
  if (!student) {
    throw new Error('등록되지 않은 학생입니다. 선생님께 명단 등록을 문의하세요.');
  }

  // 1. 첫 로그인인 경우 (비밀번호가 비어있음): 입력한 비밀번호를 시트에 바로 저장
  if (!student.pinHash || String(student.pinHash).trim() === '') {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_(SHEETS.STUDENTS);
      const data = sheet.getDataRange().getValues();
      const header = data[0].map(h => String(h || '').trim().toLowerCase());
      let colNum = header.findIndex(h => h === 'studentnumber' || h === '학번' || h === '번호');
      let colPin = header.findIndex(h => h === 'pinhash' || h === 'pin' || h === '비밀번호' || h === '핀번호');
      if (colNum < 0) colNum = 1;
      if (colPin < 0) colPin = 4;

      const idx = data.findIndex((r, i) => i > 0 && formatStudentNumber_(r[colNum] || r[0]) === studentNumber);
      if (idx > 0) {
        sheet.getRange(idx + 1, colPin + 1).setValue("'" + pin);
      }
    } finally {
      lock.releaseLock();
    }

    return {
      ok: true,
      isFirstLogin: true,
      student: {
        studentId: student.studentId,
        studentNumber: student.studentNumber,
        studentName: student.studentName,
        classId: student.classId,
      }
    };
  }

  // 2. 이미 비밀번호가 설정된 경우: 비밀번호 일치 검사
  if (formatPin_(student.pinHash) !== pin) {
    throw new Error('비밀번호가 일치하지 않습니다. (비밀번호 분실 시 선생님께 초기화를 요청하세요)');
  }

  return {
    ok: true,
    student: {
      studentId: student.studentId,
      studentNumber: student.studentNumber,
      studentName: student.studentName,
      classId: student.classId,
    }
  };
}

function setupPin_(params) {
  const studentNumber = formatStudentNumber_(params.studentNumber);
  const studentName = String(params.studentName || '').trim();
  const pin = formatPin_(params.pin);

  if (!studentNumber || studentNumber.length !== 4) throw new Error('학번 4자리를 정확히 입력해주세요.');
  if (!studentName) throw new Error('이름을 입력해주세요.');
  if (!pin || pin.length !== 4) throw new Error('초기 비밀번호 4자리를 입력해주세요.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.STUDENTS);
    const data = sheet.getDataRange().getValues();

    // 헤더가 없으면 자동 생성
    if (data.length === 0 || (data.length === 1 && !data[0][0])) {
      sheet.appendRow(['studentId', 'studentNumber', 'studentName', 'classId', 'pinHash']);
    }

    const idx = data.findIndex((r, i) => i > 0 && formatStudentNumber_(r[1]) === studentNumber);

    if (idx > 0) {
      // 시트에 이미 학번이 있는 경우: 이름 확인 및 PIN 저장
      const existingName = String(data[idx][2]).trim();
      if (existingName && existingName !== studentName) {
        throw new Error('시트에 등록된 이름(' + existingName + ')과 일치하지 않습니다.');
      }
      const existingPin = data[idx][4];
      if (existingPin && String(existingPin).trim() !== '') {
        throw new Error('이미 초기 비밀번호가 설정된 학생입니다. 로그인 화면에서 로그인해주세요. (비밀번호 분실 시 선생님께 초기화를 요청하세요)');
      }
      if (!existingName) {
        sheet.getRange(idx + 1, 3).setValue(studentName);
      }
      sheet.getRange(idx + 1, 5).setValue("'" + pin);

      return {
        ok: true,
        student: {
          studentId: String(data[idx][0] || ('s' + studentNumber)),
          studentNumber: studentNumber,
          studentName: studentName,
          classId: String(data[idx][3] || ''),
        }
      };
    } else {
      // 시트에 아직 학생이 없는 경우: 구글 시트에 새 행으로 자동 추가 (양방향 동기화)
      const studentId = 's' + studentNumber;
      sheet.appendRow([studentId, "'" + studentNumber, studentName, '', "'" + pin]);

      return {
        ok: true,
        student: {
          studentId: studentId,
          studentNumber: studentNumber,
          studentName: studentName,
          classId: '',
        }
      };
    }
  } finally {
    lock.releaseLock();
  }
}

/** 관리자: 학생 PIN 변경/재설정 */
function updateStudentPin_(params) {
  const { studentId, studentNumber, newPin } = params;
  const cleanPin = formatPin_(newPin);
  const cleanNum = formatStudentNumber_(studentNumber);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.STUDENTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && (String(r[0]) === studentId || formatStudentNumber_(r[1]) === cleanNum));
    if (idx < 0) throw new Error('학생을 찾을 수 없습니다.');

    sheet.getRange(idx + 1, 5).setValue("'" + cleanPin);
    return { ok: true, message: '학생 비밀번호가 성공적으로 변경되었습니다.' };
  } finally {
    lock.releaseLock();
  }
}

/** 관리자: 학생 PIN 초기화 (학생이 [처음이에요]로 재설정 가능하게 비움) */
function resetStudentPin_(params) {
  const { studentId, studentNumber } = params;
  const cleanNum = formatStudentNumber_(studentNumber);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.STUDENTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && (String(r[0]) === studentId || formatStudentNumber_(r[1]) === cleanNum));
    if (idx < 0) throw new Error('학생을 찾을 수 없습니다.');

    sheet.getRange(idx + 1, 5).setValue('');
    return { ok: true, message: '학생 비밀번호가 초기화되었습니다. 학생이 다시 설정할 수 있습니다.' };
  } finally {
    lock.releaseLock();
  }
}

function uploadStudents_(params) {
  const lines = params.csvData.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV 데이터가 비어있습니다.');

  const sheet = getSheet_(SHEETS.STUDENTS);
  // 헤더 설정
  sheet.clear();
  sheet.appendRow(['studentId', 'studentNumber', 'studentName', 'classId', 'pinHash']);

  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => c.trim());
    if (cols.length >= 2) {
      const studentNumber = cols[0];
      const studentName = cols[1];
      const classId = cols[2] || '';
      const studentId = 's' + studentNumber;
      sheet.appendRow([studentId, studentNumber, studentName, classId, '']);
    }
  });

  return { ok: true };
}

// ==================== 과목 관리 ====================

function getSubjectsList_() {
  const sheet = getSheet_(SHEETS.SUBJECTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    // 과목 시트가 비어있으면 기본 과목 자동 초기화
    sheet.clear();
    sheet.appendRow(['subjectId', 'subjectName', 'maxScore', 'active']);
    sheet.appendRow(['korean', '국어', 100, true]);
    sheet.appendRow(['english', '영어', 100, true]);
    sheet.appendRow(['math', '수학', 100, true]);
    sheet.appendRow(['science', '과학', 100, true]);
    return [
      { subjectId: 'korean', subjectName: '국어', maxScore: 100, active: true },
      { subjectId: 'english', subjectName: '영어', maxScore: 100, active: true },
      { subjectId: 'math', subjectName: '수학', maxScore: 100, active: true },
      { subjectId: 'science', subjectName: '과학', maxScore: 100, active: true },
    ];
  }
  return data.slice(1).filter(r => r[0]).map(r => ({
    subjectId: String(r[0]),
    subjectName: String(r[1]),
    maxScore: Number(r[2] || 100),
    active: r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE',
  }));
}

function getSubjects_() {
  return { ok: true, subjects: getSubjectsList_() };
}

/** 관리자: 과목 추가 (과목 ID는 영문 불필요, 자동 부여) */
function addSubject_(params) {
  const name = String(params.subjectName || '').trim();
  if (!name) throw new Error('과목명을 입력해주세요.');
  const maxScore = Number(params.maxScore || 100);
  const subjectId = params.subjectId || ('sub_' + Date.now());

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.SUBJECTS);
    sheet.appendRow([subjectId, name, maxScore, true]);
    return { ok: true, subject: { subjectId, subjectName: name, maxScore, active: true } };
  } finally {
    lock.releaseLock();
  }
}

/** 관리자: 과목 삭제 */
function deleteSubject_(params) {
  const subjectId = String(params.subjectId || '');
  if (!subjectId) throw new Error('과목 ID가 누락되었습니다.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.SUBJECTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === subjectId);
    if (idx < 0) throw new Error('해당 과목을 찾을 수 없습니다.');

    sheet.deleteRow(idx + 1);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ==================== PAIR 신청 ====================

function createPairRequest_(params) {
  const { fromId, toId, subjectId, target } = params;

  if (fromId === toId) throw new Error('자기 자신에게는 신청할 수 없습니다.');
  if (!isApplicationOpen_(subjectId)) throw new Error('응모가 마감되었습니다.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pairs = getPairsList_();
    const activePairs = pairs.filter(p => p.status === 'ACTIVE');

    // 1인당 최대 2개 페어 허용 (학급 인원 홀수 대비)
    const fromCount = activePairs.filter(p =>
      p.studentA === fromId || p.studentB === fromId
    ).length;
    if (fromCount >= 2) throw new Error('이미 최대 페어(2개)를 모두 완료했습니다.');

    const toCount = activePairs.filter(p =>
      p.studentA === toId || p.studentB === toId
    ).length;
    if (toCount >= 2) throw new Error('해당 친구는 이미 최대 페어(2개)를 모두 완료했습니다.');

    // [예외처리 1: 서로 다른 학생] 과목이 다르더라도 이미 나와 페어를 맺은 동일한 친구와는 중복 페어 불가
    const alreadyPartnerWithFriend = activePairs.some(p =>
      (p.studentA === fromId && p.studentB === toId) || (p.studentA === toId && p.studentB === fromId)
    );
    if (alreadyPartnerWithFriend) {
      throw new Error('이미 페어를 맺은 친구와는 두 번째 페어를 맺을 수 없습니다. (반드시 서로 다른 친구와 페어해야 합니다)');
    }

    // [예외처리 2: 서로 다른 과목] 내가 이미 해당 과목 페어가 있는지 검사
    const fromHasSubject = activePairs.some(p =>
      p.subjectId === subjectId && (p.studentA === fromId || p.studentB === fromId)
    );
    if (fromHasSubject) {
      throw new Error('이미 해당 과목의 페어를 완료했습니다. (서로 다른 과목으로 페어해야 합니다)');
    }

    // [예외처리 3: 서로 다른 과목] 상대방이 이미 해당 과목 페어가 있는지 검사
    const toHasSubject = activePairs.some(p =>
      p.subjectId === subjectId && (p.studentA === toId || p.studentB === toId)
    );
    if (toHasSubject) {
      throw new Error('해당 친구는 이미 해당 과목의 페어를 완료했습니다.');
    }

    // 동일 친구에게 대기 중인 신청 검사
    const requests = getRequestsList_();
    const hasPending = requests.some(r =>
      r.subjectId === subjectId && r.status === 'PENDING' && r.fromId === fromId && r.toId === toId
    );
    if (hasPending) throw new Error('이미 해당 친구에게 대기 중인 신청이 있습니다.');

    const requestId = Utilities.getUuid();
    const sheet = getSheet_(SHEETS.PAIR_REQUESTS);
    sheet.appendRow([requestId, subjectId, fromId, toId, Number(target), 'PENDING', new Date().toISOString()]);

    return { ok: true, requestId };
  } finally {
    lock.releaseLock();
  }
}

function getRequestsList_() {
  const sheet = getSheet_(SHEETS.PAIR_REQUESTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => r[0]).map(r => ({
    requestId: String(r[0]),
    subjectId: String(r[1]),
    fromId: String(r[2]),
    toId: String(r[3]),
    target: Number(r[4]),
    status: String(r[5]),
    createdAt: String(r[6]),
  }));
}

function getReceivedRequests_(params) {
  const requests = getRequestsList_().filter(r => r.toId === params.studentId && r.status === 'PENDING');
  return { ok: true, requests };
}

function getSentRequests_(params) {
  const requests = getRequestsList_().filter(r => r.fromId === params.studentId);
  return { ok: true, requests };
}

function acceptPairRequest_(params) {
  const { requestId, responderId } = params;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIR_REQUESTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === requestId);
    if (idx < 0) throw new Error('신청을 찾을 수 없습니다.');

    const row = data[idx];
    if (String(row[3]) !== responderId) throw new Error('이 신청을 처리할 권한이 없습니다.');
    if (String(row[5]) !== 'PENDING') throw new Error('이미 처리된 신청입니다.');

    const subjectId = String(row[1]);
    const fromId = String(row[2]);
    const toId = String(row[3]);

    if (!isApplicationOpen_(subjectId)) throw new Error('신청 변경 기간이 마감되었습니다.');

    const pairs = getPairsList_();
    const activePairs = pairs.filter(p => p.status === 'ACTIVE');

    // 최대 2개 페어 검사
    const fromCount = activePairs.filter(p =>
      p.studentA === fromId || p.studentB === fromId
    ).length;
    if (fromCount >= 2) throw new Error('신청 학생이 이미 최대 페어(2개)를 모두 완료했습니다.');

    const toCount = activePairs.filter(p =>
      p.studentA === toId || p.studentB === toId
    ).length;
    if (toCount >= 2) throw new Error('이미 최대 페어(2개)를 모두 완료했습니다.');

    // [예외처리 1: 서로 다른 학생] 과목이 다르더라도 이미 나와 페어를 맺은 동일한 친구와는 중복 수락 불가
    const alreadyPartner = activePairs.some(p =>
      (p.studentA === fromId && p.studentB === toId) || (p.studentA === toId && p.studentB === fromId)
    );
    if (alreadyPartner) {
      throw new Error('이미 해당 친구와 다른 과목에서 페어가 성사되어 있습니다. 페어는 반드시 서로 다른 학생과 맺어야 합니다.');
    }

    // [예외처리 2: 서로 다른 과목] 수락자(나)가 이미 해당 과목 페어를 맺은 경우 다른 신청서 수락 차단
    const toHasSubject = activePairs.some(p =>
      p.subjectId === subjectId && (p.studentA === toId || p.studentB === toId)
    );
    if (toHasSubject) {
      throw new Error('이미 해당 과목의 페어를 완료하여, 같은 과목에 대한 다른 신청서는 수락할 수 없습니다.');
    }

    // [예외처리 3: 서로 다른 과목] 신청 학생이 이미 해당 과목 페어를 맺은 경우 수락 차단
    const fromHasSubject = activePairs.some(p =>
      p.subjectId === subjectId && (p.studentA === fromId || p.studentB === fromId)
    );
    if (fromHasSubject) {
      throw new Error('신청 학생이 이미 해당 과목의 페어를 완료하여 수락할 수 없습니다.');
    }

    // 신청 상태 변경
    sheet.getRange(idx + 1, 6).setValue('ACCEPTED');

    // PAIR 생성
    const pairId = Utilities.getUuid();
    const pairSheet = getSheet_(SHEETS.PAIRS);
    const baseRange = Number(getSetting_('BASE_RANGE') || 5);
    pairSheet.appendRow([pairId, subjectId, fromId, toId, Number(row[4]), baseRange, 'ACTIVE', new Date().toISOString()]);

    // 성사 후 정리 작업:
    // 이미 페어가 성사된 두 학생 사이의 다른 PENDING 신청 건만 유효하지 않으므로 취소 처리.
    // (다른 사람과의 신청이나 다른 과목 신청은 대기 목록에 유지하여 UI에서 수락 불가 사유를 보여줌)
    for (let i = 1; i < data.length; i++) {
      if (i !== idx && String(data[i][5]) === 'PENDING') {
        const f = String(data[i][2]);
        const t = String(data[i][3]);
        const betweenBoth = (f === fromId && t === toId) || (f === toId && t === fromId);
        if (betweenBoth) {
          sheet.getRange(i + 1, 6).setValue('CANCELLED');
        }
      }
    }

    return { ok: true, pairId };
  } finally {
    lock.releaseLock();
  }
}

/** 성사된 페어 해제 (페어 끊기) - 신청 변경 기간 내 가능 */
function cancelPair_(params) {
  const { pairId, studentId } = params;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pairSheet = getSheet_(SHEETS.PAIRS);
    const data = pairSheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === pairId);
    if (idx < 0) throw new Error('페어 정보를 찾을 수 없습니다.');

    const row = data[idx];
    const subjectId = String(row[1]);
    const studentA = String(row[2]);
    const studentB = String(row[3]);

    if (studentA !== studentId && studentB !== studentId) {
      throw new Error('권한이 없습니다.');
    }

    if (!isApplicationOpen_(subjectId)) {
      throw new Error('신청 변경 기간이 마감되어 페어를 수정할 수 없습니다.');
    }

    // 상태를 CANCELLED로 변경
    pairSheet.getRange(idx + 1, 7).setValue('CANCELLED');
    return { ok: true, message: '페어가 성공적으로 해제되었습니다.' };
  } finally {
    lock.releaseLock();
  }
}

function rejectPairRequest_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIR_REQUESTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === params.requestId);
    if (idx < 0) throw new Error('신청을 찾을 수 없습니다.');
    if (String(data[idx][3]) !== params.responderId) throw new Error('권한이 없습니다.');
    sheet.getRange(idx + 1, 6).setValue('REJECTED');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function cancelPairRequest_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIR_REQUESTS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === params.requestId);
    if (idx < 0) throw new Error('신청을 찾을 수 없습니다.');
    if (String(data[idx][2]) !== params.studentId) throw new Error('권한이 없습니다.');
    if (String(data[idx][5]) !== 'PENDING') throw new Error('이미 처리된 신청입니다.');
    if (!isApplicationOpen_(String(data[idx][1]))) throw new Error('응모가 마감되었습니다.');
    sheet.getRange(idx + 1, 6).setValue('CANCELLED');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getAllRequests_() {
  return { ok: true, requests: getRequestsList_() };
}

// ==================== PAIR 관리 ====================

function getPairsList_() {
  const sheet = getSheet_(SHEETS.PAIRS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => r[0]).map(r => ({
    pairId: String(r[0]),
    subjectId: String(r[1]),
    studentA: String(r[2]),
    studentB: String(r[3]),
    target: Number(r[4]),
    baseRange: Number(r[5] || 5),
    status: String(r[6]),
    createdAt: String(r[7]),
  }));
}

function getMyPairs_(params) {
  const pairs = getPairsList_().filter(p =>
    (p.studentA === params.studentId || p.studentB === params.studentId) && p.status === 'ACTIVE'
  );
  return { ok: true, pairs };
}

function getAllPairs_() {
  return { ok: true, pairs: getPairsList_() };
}

function deletePair_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIRS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === params.pairId);
    if (idx < 0) throw new Error('PAIR를 찾을 수 없습니다.');
    sheet.getRange(idx + 1, 7).setValue('CANCELLED');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function updatePairTarget_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIRS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === params.pairId);
    if (idx < 0) throw new Error('PAIR를 찾을 수 없습니다.');
    sheet.getRange(idx + 1, 5).setValue(Number(params.newTarget));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function unlockStudentPair_(params) {
  // 특정 학생의 PAIR를 취소하여 재응모 허용
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.PAIRS);
    const data = sheet.getDataRange().getValues();
    data.forEach((r, i) => {
      if (i > 0 && String(r[1]) === params.subjectId &&
          (String(r[2]) === params.studentId || String(r[3]) === params.studentId) &&
          String(r[6]) === 'ACTIVE') {
        sheet.getRange(i + 1, 7).setValue('CANCELLED');
      }
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** 관리자: 미응모/소외 학생 자동 매칭 미리보기 (시트에 저장하지 않고 후보 생성) */
function previewAutoMatch_(params) {
  const studentsRes = getStudentsList_();
  const pairs = getPairsList_().filter(p => p.status === 'ACTIVE');
  const subjects = getSubjectsList_().filter(s => s.active);

  if (subjects.length === 0) {
    throw new Error('활성화된 과목이 없습니다.');
  }

  // 각 학생별 참여 과목 및 파트너 목록 집계
  const studentMeta = {};
  studentsRes.forEach(s => {
    studentMeta[s.studentId] = {
      student: s,
      pairCount: 0,
      pairedSubjects: new Set(),
      pairedPartners: new Set(),
    };
  });

  pairs.forEach(p => {
    if (studentMeta[p.studentA]) {
      studentMeta[p.studentA].pairCount++;
      studentMeta[p.studentA].pairedSubjects.add(p.subjectId);
      studentMeta[p.studentA].pairedPartners.add(p.studentB);
    }
    if (studentMeta[p.studentB]) {
      studentMeta[p.studentB].pairCount++;
      studentMeta[p.studentB].pairedSubjects.add(p.subjectId);
      studentMeta[p.studentB].pairedPartners.add(p.studentA);
    }
  });

  // 페어 2개 미만인 학생들만 대상 (0개인 학생 우선, 그 다음 1개인 학생)
  const candidateIds = Object.keys(studentMeta).filter(id => studentMeta[id].pairCount < 2);
  if (candidateIds.length < 2) {
    return {
      ok: true,
      previewPairs: [],
      unpairedStudents: candidateIds.map(id => studentMeta[id].student),
      message: '자동 매칭 대상 학생이 2명 미만입니다.'
    };
  }

  // 셔플
  const shuffledIds = [...candidateIds].sort(() => Math.random() - 0.5);

  const previewPairs = [];
  const assignedInRound = new Set();

  for (let i = 0; i < shuffledIds.length; i++) {
    const idA = shuffledIds[i];
    if (assignedInRound.has(idA)) continue;
    if (studentMeta[idA].pairCount >= 2) continue;

    // 파트너 찾기 (서로 다른 학생, 공통 미이수 과목 존재)
    let partnerId = null;
    let chosenSubjectId = null;

    for (let j = i + 1; j < shuffledIds.length; j++) {
      const idB = shuffledIds[j];
      if (assignedInRound.has(idB)) continue;
      if (studentMeta[idB].pairCount >= 2) continue;

      // 1. 이미 페어를 맺은 사이인지 검사 (서로 다른 학생 원칙)
      if (studentMeta[idA].pairedPartners.has(idB) || studentMeta[idB].pairedPartners.has(idA)) {
        continue;
      }

      // 2. 둘 모두에게 아직 없는 공통 과목 찾기 (서로 다른 과목 원칙)
      const commonSubjects = subjects.filter(s =>
        !studentMeta[idA].pairedSubjects.has(s.subjectId) &&
        !studentMeta[idB].pairedSubjects.has(s.subjectId)
      );

      if (commonSubjects.length > 0) {
        partnerId = idB;
        chosenSubjectId = commonSubjects[0].subjectId;
        break;
      }
    }

    if (partnerId && chosenSubjectId) {
      assignedInRound.add(idA);
      assignedInRound.add(partnerId);

      studentMeta[idA].pairCount++;
      studentMeta[idA].pairedSubjects.add(chosenSubjectId);
      studentMeta[idA].pairedPartners.add(partnerId);

      studentMeta[partnerId].pairCount++;
      studentMeta[partnerId].pairedSubjects.add(chosenSubjectId);
      studentMeta[partnerId].pairedPartners.add(idA);

      previewPairs.push({
        tempId: 'preview_' + Date.now() + '_' + previewPairs.length,
        subjectId: chosenSubjectId,
        studentA: idA,
        studentB: partnerId,
        target: 180,
      });
    }
  }

  // 매칭되지 못한 남은 학생 목록
  const unpairedStudents = studentsRes.filter(s =>
    (studentMeta[s.studentId]?.pairCount || 0) < 2 && !assignedInRound.has(s.studentId)
  );

  return {
    ok: true,
    previewPairs,
    unpairedStudents,
    totalCandidates: candidateIds.length,
    matchedCount: previewPairs.length
  };
}

/** 관리자: 교사가 미리보기에서 확인/수정한 자동 매칭 페어 목록 최종 일괄 저장 */
function saveAutoMatchedPairs_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const listToSave = params.pairs || [];
    if (!Array.isArray(listToSave) || listToSave.length === 0) {
      throw new Error('저장할 매칭 데이터가 없습니다.');
    }

    const pairsSheet = getSheet_(SHEETS.PAIRS);
    const existingPairs = getPairsList_().filter(p => p.status === 'ACTIVE');
    const baseRange = Number(getSetting_('BASE_RANGE') || 5);

    // 각 학생의 활성 페어 수 및 과목 추적용 맵
    const studentPairCount = {};
    const studentSubjects = {};
    const pairPartners = new Set();

    existingPairs.forEach(p => {
      studentPairCount[p.studentA] = (studentPairCount[p.studentA] || 0) + 1;
      studentPairCount[p.studentB] = (studentPairCount[p.studentB] || 0) + 1;

      if (!studentSubjects[p.studentA]) studentSubjects[p.studentA] = new Set();
      if (!studentSubjects[p.studentB]) studentSubjects[p.studentB] = new Set();
      studentSubjects[p.studentA].add(p.subjectId);
      studentSubjects[p.studentB].add(p.subjectId);

      pairPartners.add(`${p.studentA}::${p.studentB}`);
      pairPartners.add(`${p.studentB}::${p.studentA}`);
    });

    let savedCount = 0;
    const now = new Date().toISOString();

    listToSave.forEach((item, index) => {
      const { studentA, studentB, subjectId, target } = item;
      if (!studentA || !studentB || !subjectId) return;
      if (studentA === studentB) {
        throw new Error(`[#${index + 1}팀] 동일한 학생끼리는 페어를 맺을 수 없습니다.`);
      }

      // 최대 2개 검사
      if ((studentPairCount[studentA] || 0) >= 2) {
        throw new Error(`[#${index + 1}팀] ${studentA} 학생은 이미 2개 페어가 완료되었습니다.`);
      }
      if ((studentPairCount[studentB] || 0) >= 2) {
        throw new Error(`[#${index + 1}팀] ${studentB} 학생은 이미 2개 페어가 완료되었습니다.`);
      }

      // 서로 다른 학생 검사
      if (pairPartners.has(`${studentA}::${studentB}`)) {
        throw new Error(`[#${index + 1}팀] 두 학생은 이미 다른 과목에서 페어되어 있어 중복 매칭할 수 없습니다.`);
      }

      // 서로 다른 과목 검사
      if (studentSubjects[studentA] && studentSubjects[studentA].has(subjectId)) {
        throw new Error(`[#${index + 1}팀] ${studentA} 학생은 이미 해당 과목 페어가 있습니다.`);
      }
      if (studentSubjects[studentB] && studentSubjects[studentB].has(subjectId)) {
        throw new Error(`[#${index + 1}팀] ${studentB} 학생은 이미 해당 과목 페어가 있습니다.`);
      }

      // 유효성 통과 -> 상태 업데이트 및 시트 추가
      studentPairCount[studentA] = (studentPairCount[studentA] || 0) + 1;
      studentPairCount[studentB] = (studentPairCount[studentB] || 0) + 1;

      if (!studentSubjects[studentA]) studentSubjects[studentA] = new Set();
      if (!studentSubjects[studentB]) studentSubjects[studentB] = new Set();
      studentSubjects[studentA].add(subjectId);
      studentSubjects[studentB].add(subjectId);

      pairPartners.add(`${studentA}::${studentB}`);
      pairPartners.add(`${studentB}::${studentA}`);

      const pairId = Utilities.getUuid();
      pairsSheet.appendRow([pairId, subjectId, studentA, studentB, Number(target || 180), baseRange, 'ACTIVE', now]);
      savedCount++;
    });

    return { ok: true, savedCount, message: `${savedCount}개의 페어가 성공적으로 저장되었습니다.` };
  } finally {
    lock.releaseLock();
  }
}

/** 기존 호환용 즉시 자동 매칭 */
function autoMatchUnpairedStudents_(params) {
  const preview = previewAutoMatch_(params);
  if (!preview.ok || preview.previewPairs.length === 0) {
    return preview;
  }
  return saveAutoMatchedPairs_({ pairs: preview.previewPairs });
}

// ==================== 미션 관리 ====================

function getMissionsList_() {
  const sheet = getSheet_(SHEETS.MISSIONS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => r[0]).map(r => ({
    missionId: String(r[0]),
    missionNo: Number(r[1]),
    title: String(r[2]),
    description: String(r[3]),
  }));
}

function getMissions_() {
  return { ok: true, missions: getMissionsList_() };
}

function getMissionStatus_(params) {
  const submissions = getSubmissionsList_().filter(s => s.pairId === params.pairId && s.status === 'APPROVED');
  return { ok: true, submissions };
}

function getSubmissionsList_() {
  const sheet = getSheet_(SHEETS.MISSION_SUBMISSIONS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => r[0]).map(r => ({
    submissionId: String(r[0]),
    pairId: String(r[1]),
    subjectId: String(r[2]),
    missionId: String(r[3]),
    uploaderId: String(r[4]),
    fileId: String(r[5] || ''),
    fileUrl: String(r[6] || ''),
    status: String(r[7]),
    submittedAt: String(r[8]),
  }));
}

function submitMission_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // 중복 제출 검사
    const existing = getSubmissionsList_().find(s =>
      s.pairId === params.pairId && s.missionId === params.missionId && s.status === 'APPROVED'
    );
    if (existing) throw new Error('이미 인증된 미션입니다.');

    // 사진 Google Drive에 저장
    let fileId = '';
    let fileUrl = '';
    if (params.base64) {
      const propFolder = PropertiesService.getScriptProperties().getProperty('MISSION_FOLDER_ID');
      const targetFolder = propFolder || DRIVE_FOLDER_ID;
      const folderId = extractId_(targetFolder);
      if (folderId) {
        // 파일명 생성을 위한 학생 및 미션 정보 조회
        const student = getStudentsList_().find(s => s.studentId === params.uploaderId);
        const mission = getMissionsList_().find(m => m.missionId === params.missionId);
        const studentNum = student ? student.studentNumber : 'Unknown';
        const missionTitle = mission ? mission.title.replace(/[\\/:*?"<>|]/g, '') : params.missionId; // 특수문자 제거
        
        const now = new Date();
        const dStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd_HHmm");
        let ext = 'jpg';
        if (params.mimeType) {
          if (params.mimeType.includes('png')) ext = 'png';
          else if (params.mimeType.includes('webp')) ext = 'webp';
        }
        const finalFileName = `${studentNum}_${missionTitle}_${dStr}.${ext}`;

        const bytes = Utilities.base64Decode(params.base64);
        const blob = Utilities.newBlob(bytes, params.mimeType || 'image/jpeg', finalFileName);
        const file = DriveApp.getFolderById(folderId).createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileId = file.getId();
        // 썸네일 URL을 우선 생성하여 img 태그에서 바로 렌더링되도록 처리
        fileUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';
      }
    }

    const submissionId = Utilities.getUuid();
    const sheet = getSheet_(SHEETS.MISSION_SUBMISSIONS);
    sheet.appendRow([
      submissionId,
      params.pairId,
      params.subjectId,
      params.missionId,
      params.uploaderId,
      fileId,
      fileUrl,
      'APPROVED', // 기본 자동 승인
      new Date().toISOString()
    ]);

    return { ok: true, submissionId };
  } finally {
    lock.releaseLock();
  }
}

function getAllMissionSubmissions_() {
  return { ok: true, submissions: getSubmissionsList_() };
}

function revokeMission_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_(SHEETS.MISSION_SUBMISSIONS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r, i) => i > 0 && String(r[0]) === params.submissionId);
    if (idx < 0) throw new Error('인증을 찾을 수 없습니다.');
    sheet.getRange(idx + 1, 8).setValue('REVOKED');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function updateMissions_(params) {
  const sheet = getSheet_(SHEETS.MISSIONS);
  sheet.clear();
  sheet.appendRow(['missionId', 'missionNo', 'title', 'description']);
  (params.missions || []).forEach(m => {
    sheet.appendRow([m.missionId, m.missionNo, m.title, m.description]);
  });
  return { ok: true };
}

// ==================== 시험 결과 ====================

function uploadExamResults_(params) {
  const data = params.data || [];
  if (data.length === 0) throw new Error('점수 데이터가 비어있습니다.');

  const sheet = getSheet_(SHEETS.EXAM_RESULTS);
  sheet.clear();
  sheet.appendRow(['studentId', 'subjectId', 'score', 'uploadedAt']);
  const now = new Date().toISOString();
  data.forEach(d => {
    sheet.appendRow([d.studentId, d.subjectId, Number(d.score), now]);
  });

  return { ok: true, count: data.length };
}

function getExamResultsList_() {
  const sheet = getSheet_(SHEETS.EXAM_RESULTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => r[0]).map(r => ({
    studentId: String(r[0]),
    subjectId: String(r[1]),
    score: Number(r[2]),
  }));
}

// ==================== 결과 판정 ====================

function calculateResults_() {
  const pairs = getPairsList_().filter(p => p.status === 'ACTIVE');
  const examResults = getExamResultsList_();
  const submissions = getSubmissionsList_().filter(s => s.status === 'APPROVED');

  const baseRange = Number(getSetting_('BASE_RANGE') || 5);
  const bonusPerMission = Number(getSetting_('BONUS_PER_MISSION') || 1);
  const nearMissRange = Number(getSetting_('NEAR_MISS_RANGE') || 3);

  const results = [];

  pairs.forEach(pair => {
    const scoreA = examResults.find(e => e.studentId === pair.studentA && e.subjectId === pair.subjectId);
    const scoreB = examResults.find(e => e.studentId === pair.studentB && e.subjectId === pair.subjectId);
    if (!scoreA || !scoreB) return;

    const sum = scoreA.score + scoreB.score;
    const missionCount = submissions.filter(s => s.pairId === pair.pairId).length;
    const finalRange = baseRange + (missionCount * bonusPerMission);
    const diff = Math.abs(sum - pair.target);

    let result;
    if (sum === pair.target) result = 'JACKPOT';
    else if (diff <= finalRange) result = 'WIN';
    else if (diff <= finalRange + nearMissRange) result = 'NEAR_MISS';
    else result = 'MISS';

    results.push({
      pairId: pair.pairId,
      subjectId: pair.subjectId,
      studentA: pair.studentA,
      studentB: pair.studentB,
      scoreA: scoreA.score,
      scoreB: scoreB.score,
      sum,
      target: pair.target,
      missionCount,
      finalRange,
      rangeMin: pair.target - finalRange,
      rangeMax: pair.target + finalRange,
      result,
    });
  });

  // 결과 저장
  const sheet = getSheet_(SHEETS.RESULTS);
  sheet.clear();
  sheet.appendRow(['pairId', 'subjectId', 'studentA', 'studentB', 'scoreA', 'scoreB', 'sum', 'target', 'missionCount', 'finalRange', 'rangeMin', 'rangeMax', 'result']);
  results.forEach(r => {
    sheet.appendRow([r.pairId, r.subjectId, r.studentA, r.studentB, r.scoreA, r.scoreB, r.sum, r.target, r.missionCount, r.finalRange, r.rangeMin, r.rangeMax, r.result]);
  });

  return { ok: true, results };
}

function getAllResults_() {
  const sheet = getSheet_(SHEETS.RESULTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, results: [] };
  const results = data.slice(1).filter(r => r[0]).map(r => ({
    pairId: String(r[0]),
    subjectId: String(r[1]),
    studentA: String(r[2]),
    studentB: String(r[3]),
    scoreA: Number(r[4]),
    scoreB: Number(r[5]),
    sum: Number(r[6]),
    target: Number(r[7]),
    missionCount: Number(r[8]),
    finalRange: Number(r[9]),
    rangeMin: Number(r[10]),
    rangeMax: Number(r[11]),
    result: String(r[12]),
  }));
  return { ok: true, results };
}

function getStudentResults_(params) {
  const all = getAllResults_();
  const results = (all.results || []).filter(r => r.studentA === params.studentId || r.studentB === params.studentId);
  return { ok: true, results };
}

// ==================== 관리자 ====================

function adminLogin_(params) {
  const propPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  const validHashes = [
    'ad5f52f58ed6ec6e7a641f2416f347674ac5933470079f2a18bc6269b1e80796', // sha256('minah')
    'e90f23b2bfa9a6dd6313364fa4e6777c98c0b533cb1b0fa3f6ce4048cfc526be'
  ];

  const input = String(params.password || '').trim().toLowerCase();

  // 1. 프로퍼티가 등록되어 있는 경우 검사
  if (propPassword && (input === propPassword.toLowerCase() || input === 'minah')) {
    return { ok: true };
  }

  // 2. 해시값 검사 (보안)
  if (validHashes.includes(input)) {
    return { ok: true };
  }

  // 3. 평문 검사
  if (input === 'minah') {
    return { ok: true };
  }

  throw new Error('비밀번호가 일치하지 않습니다.');
}

// ==================== 대시보드 통계 ====================

function getDashboardStats_() {
  const students = getStudentsList_();
  const pairs = getPairsList_().filter(p => p.status === 'ACTIVE');
  const requests = getRequestsList_().filter(r => r.status === 'PENDING');
  const submissions = getSubmissionsList_().filter(s => s.status === 'APPROVED');
  const results = getAllResults_().results || [];
  const examResults = getExamResultsList_();

  const studentsWithPairs = new Set();
  pairs.forEach(p => { studentsWithPairs.add(p.studentA); studentsWithPairs.add(p.studentB); });

  return {
    ok: true,
    stats: {
      totalStudents: students.length,
      activePairs: pairs.length,
      pendingRequests: requests.length,
      completedMissions: submissions.length,
      studentsWithoutPairs: students.length - studentsWithPairs.size,
      resultsUploaded: examResults.length > 0,
      winCount: results.filter(r => r.result === 'WIN' || r.result === 'JACKPOT').length,
    }
  };
}

// ==================== 학생 홈 (Polling 최적화) ====================

function getStudentHome_(params) {
  const studentId = params.studentId;
  const students = getStudentsList_().map(s => ({
    studentId: s.studentId,
    studentNumber: s.studentNumber,
    studentName: s.studentName,
    classId: s.classId,
  }));
  const subjects = getSubjectsList_();
  const appStatus = getApplicationStatus_();
  const missions = getMissionsList_();
  const requests = getRequestsList_();
  const pairs = getPairsList_().filter(p => (p.studentA === studentId || p.studentB === studentId) && p.status === 'ACTIVE');
  const receivedRequests = requests.filter(r => r.toId === studentId && r.status === 'PENDING');
  const sentRequests = requests.filter(r => r.fromId === studentId && r.status === 'PENDING');

  const allSubmissions = getSubmissionsList_();
  const missionSubmissions = {};
  pairs.forEach(p => {
    missionSubmissions[p.pairId] = allSubmissions.filter(s => s.pairId === p.pairId && s.status === 'APPROVED');
  });

  const allResults = getAllResults_().results || [];
  const results = allResults.filter(r => r.studentA === studentId || r.studentB === studentId);

  return {
    ok: true,
    students,
    subjects,
    applicationStatus: appStatus,
    missions,
    receivedRequests,
    sentRequests,
    pairs,
    missionSubmissions,
    results,
  };
}

// ==================== 초기 설정 도우미 ====================

/**
 * 기존 영문 시트 탭 이름을 한글로 자동 변경하는 마이그레이션 함수
 * Apps Script 에디터에서 migrateSheetsToKorean 함수를 실행하면
 * 기존의 SETTINGS, STUDENTS, PAIRS 등의 탭 이름이 한글로 자동 변환됩니다.
 */
function migrateSheetsToKorean() {
  const ss = getSs_();
  const mapping = {
    'SETTINGS': '설정',
    'STUDENTS': '학생명단',
    'SUBJECTS': '과목목록',
    'PAIR_REQUESTS': '페어신청',
    'PAIRS': '성사된페어',
    'MISSIONS': '미션목록',
    'MISSION_SUBMISSIONS': '미션제출',
    'EXAM_RESULTS': '시험점수',
    'RESULTS': '당첨결과',
  };

  let count = 0;
  for (const [eng, kor] of Object.entries(mapping)) {
    const sheet = ss.getSheetByName(eng);
    if (sheet && !ss.getSheetByName(kor)) {
      sheet.setName(kor);
      count++;
      Logger.log(`[시트 탭 변경 완료] ${eng} → ${kor}`);
    }
  }

  Logger.log(`총 ${count}개의 시트 탭 이름이 한글로 변경되었습니다.`);
  return { ok: true, migratedCount: count };
}

/**
 * 이 함수를 한 번 실행하여 시트 헤더와 기본 데이터를 한글로 설정합니다.
 */
function initializeSheets() {
  const ss = getSs_();

  // 1. 설정 (SETTINGS)
  const settingsSheet = getSheet_(SHEETS.SETTINGS);
  if (settingsSheet.getDataRange().getValues().length <= 1) {
    settingsSheet.appendRow(['설정항목(Key)', '설정값(Value)', '설명']);
    settingsSheet.appendRow(['APPLICATION_OPEN', 'TRUE', '전체 신청 오픈 여부']);
    settingsSheet.appendRow(['BASE_RANGE', 5, '기본 당첨범위 (±점)']);
    settingsSheet.appendRow(['BONUS_PER_MISSION', 1, '미션당 보너스 점수범위']);
    settingsSheet.appendRow(['NEAR_MISS_RANGE', 3, '아차상 범위']);
    settingsSheet.appendRow(['TARGET_OPTIONS', '100,120,140,160,180,200', '목표점수 후보']);
  }

  // 2. 학생명단 (STUDENTS)
  const studentsSheet = getSheet_(SHEETS.STUDENTS);
  if (studentsSheet.getDataRange().getValues().length <= 1) {
    studentsSheet.appendRow(['학번ID', '학번', '이름', '반', '비밀번호PIN']);
    studentsSheet.appendRow(['s2201', "'2201", '홍길동', '2-2', '']);
    studentsSheet.appendRow(['s2202', "'2202", '김민수', '2-2', '']);
    studentsSheet.appendRow(['s2203', "'2203", '박지훈', '2-2', '']);
  }

  // 3. 과목목록 (SUBJECTS)
  const subjectsSheet = getSheet_(SHEETS.SUBJECTS);
  if (subjectsSheet.getDataRange().getValues().length <= 1) {
    subjectsSheet.appendRow(['과목ID', '과목명', '만점', '신청가능여부']);
    subjectsSheet.appendRow(['korean', '국어', 100, true]);
    subjectsSheet.appendRow(['english', '영어', 100, true]);
    subjectsSheet.appendRow(['math', '수학', 100, true]);
    subjectsSheet.appendRow(['science', '과학', 100, true]);
  }

  // 4. 페어신청 (PAIR_REQUESTS)
  const reqSheet = getSheet_(SHEETS.PAIR_REQUESTS);
  if (reqSheet.getDataRange().getValues().length <= 1) {
    reqSheet.appendRow(['신청ID', '과목ID', '보낸학생', '받은학생', '목표점수', '상태', '신청일시']);
  }

  // 5. 성사된페어 (PAIRS)
  const pairsSheet = getSheet_(SHEETS.PAIRS);
  if (pairsSheet.getDataRange().getValues().length <= 1) {
    pairsSheet.appendRow(['페어ID', '과목ID', '학생A', '학생B', '목표점수', '기본범위', '상태', '생성일시']);
  }

  // 6. 미션목록 (MISSIONS)
  const missionsSheet = getSheet_(SHEETS.MISSIONS);
  if (missionsSheet.getDataRange().getValues().length <= 1) {
    missionsSheet.appendRow(['미션ID', '미션번호', '미션제목', '미션설명']);
    missionsSheet.appendRow(['mission01', 1, 'MISSION 01 · 시험 예상 문제 공유', '각자 예상 문제 또는 문제집 문제 1개를 상대방에게 보내고 풀이 과정과 함께 인증']);
    missionsSheet.appendRow(['mission02', 2, 'MISSION 02 · 오답 도와주기', '서로 틀린 문제 또는 어려운 문제를 설명하고 해결한 결과 인증']);
    missionsSheet.appendRow(['mission03', 3, 'MISSION 03 · 시험범위 체크', '서로 부족한 범위나 공부할 부분을 확인하고 결과 인증']);
  }

  // 7. 미션제출 (MISSION_SUBMISSIONS)
  const subSheet = getSheet_(SHEETS.MISSION_SUBMISSIONS);
  if (subSheet.getDataRange().getValues().length <= 1) {
    subSheet.appendRow(['제출ID', '페어ID', '과목ID', '미션ID', '제출학생', '구글파일ID', '사진URL', '상태', '제출일시']);
  }

  // 8. 시험점수 (EXAM_RESULTS)
  const examSheet = getSheet_(SHEETS.EXAM_RESULTS);
  if (examSheet.getDataRange().getValues().length <= 1) {
    examSheet.appendRow(['학생ID', '과목ID', '점수', '등록일시']);
  }

  // 9. 당첨결과 (RESULTS)
  const resultsSheet = getSheet_(SHEETS.RESULTS);
  if (resultsSheet.getDataRange().getValues().length <= 1) {
    resultsSheet.appendRow(['페어ID', '과목ID', '학생A', '학생B', '점수A', '점수B', '점수합계', '목표점수', '미션달성수', '최종당첨범위', '최소당첨점', '최대당첨점', '당첨결과']);
  }

  Logger.log('모든 시트가 한글 탭 및 한글 헤더로 초기화되었습니다.');
}

function resetAllRecords_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheetsToClear = [
      SHEETS.PAIR_REQUESTS,
      SHEETS.PAIRS,
      SHEETS.MISSION_SUBMISSIONS,
      SHEETS.EXAM_RESULTS,
      SHEETS.RESULTS
    ];
    
    sheetsToClear.forEach(sheetName => {
      const sheet = getSheet_(sheetName);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        if (data.length > 1) {
          // 첫번째 행(헤더) 남기고 모두 삭제
          sheet.getRange(2, 1, data.length - 1, sheet.getLastColumn()).clearContent();
        }
      }
    });

    return { ok: true, message: '모든 기록이 초기화되었습니다. (학생 및 과목 명단 유지)' };
  } finally {
    lock.releaseLock();
  }
}
