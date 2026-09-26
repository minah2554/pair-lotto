/**
 * PAIR LOTTO 데모 데이터
 * API_URL이 설정되지 않았을 때 사용하는 테스트 데이터입니다.
 * 실제 서비스에서는 모든 데이터가 Google Sheets에서 옵니다.
 */

export function formatPin(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).trim();
  if (/^\d{1,4}$/.test(str)) {
    return str.padStart(4, '0');
  }
  return str;
}

export function formatStudentNumber(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).trim();
  if (/^\d{1,4}$/.test(str)) {
    return str.padStart(4, '0');
  }
  return str;
}

export const DEMO_STUDENTS = [
  { studentId: 's2201', studentNumber: '2201', studentName: '홍길동', classId: '2-2' },
  { studentId: 's2202', studentNumber: '2202', studentName: '김민수', classId: '2-2' },
  { studentId: 's2203', studentNumber: '2203', studentName: '박지훈', classId: '2-2' },
  { studentId: 's2204', studentNumber: '2204', studentName: '이도윤', classId: '2-2' },
  { studentId: 's2205', studentNumber: '2205', studentName: '최현우', classId: '2-2' },
  { studentId: 's2206', studentNumber: '2206', studentName: '정우진', classId: '2-2' },
  { studentId: 's2207', studentNumber: '2207', studentName: '강서준', classId: '2-2' },
  { studentId: 's2208', studentNumber: '2208', studentName: '윤지호', classId: '2-2' },
  { studentId: 's2209', studentNumber: '2209', studentName: '조예린', classId: '2-2' },
  { studentId: 's2210', studentNumber: '2210', studentName: '한소희', classId: '2-2' },
  { studentId: 's2211', studentNumber: '2211', studentName: '배수진', classId: '2-2' },
  { studentId: 's2212', studentNumber: '2212', studentName: '송하은', classId: '2-2' },
];

export const DEMO_SUBJECTS = [
  { subjectId: 'korean', subjectName: '국어', maxScore: 100, active: true },
  { subjectId: 'english', subjectName: '영어', maxScore: 100, active: true },
  { subjectId: 'math', subjectName: '수학', maxScore: 100, active: true },
  { subjectId: 'science', subjectName: '과학', maxScore: 100, active: true },
];

export const DEMO_MISSIONS = [
  {
    missionId: 'mission01',
    missionNo: 1,
    title: 'MISSION 01 · 시험 예상 문제 공유',
    description: '각자 예상 문제 또는 문제집 문제 1개를 상대방에게 보내고 풀이 과정과 함께 인증'
  },
  {
    missionId: 'mission02',
    missionNo: 2,
    title: 'MISSION 02 · 오답 도와주기',
    description: '서로 틀린 문제 또는 어려운 문제를 설명하고 해결한 결과 인증'
  },
  {
    missionId: 'mission03',
    missionNo: 3,
    title: 'MISSION 03 · 시험범위 체크',
    description: '서로 부족한 범위나 공부할 부분을 확인하고 결과 인증'
  },
];

/** 데모 상태 (인메모리) */
export const demoState = {
  applicationStatus: {
    globalOpen: true,
    subjects: {
      korean: true,
      english: true,
      math: true,
      science: true,
    }
  },
  requests: [
    {
      requestId: 'req001',
      subjectId: 'science',
      fromId: 's2201',
      toId: 's2202',
      target: 180,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
  ],
  pairs: [
    {
      pairId: 'pair001',
      subjectId: 'science',
      studentA: 's2203',
      studentB: 's2204',
      target: 160,
      baseRange: 5,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  missionSubmissions: [
    {
      submissionId: 'sub001',
      pairId: 'pair001',
      subjectId: 'science',
      missionId: 'mission01',
      uploaderId: 's2203',
      fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a1a2e"/><circle cx="200" cy="120" r="50" fill="%2300f0ff" opacity="0.3"/><text x="200" y="130" fill="%2300f0ff" font-size="24" font-weight="bold" text-anchor="middle">과학 예상문제 3개</text><text x="200" y="180" fill="%23ffffff" font-size="14" text-anchor="middle">짝꿍과 공유한 학습 노트 인증</text><text x="200" y="210" fill="%23ffd166" font-size="12" text-anchor="middle">📸 학생 제출 사진 샘플</text></svg>',
      status: 'APPROVED',
      submittedAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      submissionId: 'sub002',
      pairId: 'pair001',
      subjectId: 'science',
      missionId: 'mission02',
      uploaderId: 's2204',
      fileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23121829"/><rect x="40" y="40" width="320" height="220" rx="12" fill="%231e293b" stroke="%23b347ff" stroke-width="2"/><text x="200" y="130" fill="%23b347ff" font-size="22" font-weight="bold" text-anchor="middle">오답노트 / 개념 정리</text><text x="200" y="170" fill="%23ffffff" font-size="14" text-anchor="middle">과학 1단원 핵심 개념 요약 완료</text><text x="200" y="205" fill="%2300ff88" font-size="12" text-anchor="middle">✅ 미션 인증 사진 샘플</text></svg>',
      status: 'APPROVED',
      submittedAt: new Date(Date.now() - 21600000).toISOString(),
    },
  ],
  examResults: [],
  results: [],
  pins: {}, // studentNumber -> hashed pin (demo: plain)
  settings: {
    BASE_RANGE: 5,
    BONUS_PER_MISSION: 1,
    NEAR_MISS_RANGE: 3,
    TARGET_OPTIONS: '100,120,140,160,180,200',
    ADMIN_PASSWORD_HASH: 'e90f23b2bfa9a6dd6313364fa4e6777c98c0b533cb1b0fa3f6ce4048cfc526be', // SHA-256 hash
  }
};

/** 데모 API 핸들러 - API 미연결 시 로컬에서 동작 */
export function handleDemoApi(action, params) {
  switch (action) {
    case 'getStudents':
      return { ok: true, students: DEMO_STUDENTS };

    case 'getSubjects':
      return { ok: true, subjects: DEMO_SUBJECTS };

    case 'getMissions':
      return { ok: true, missions: DEMO_MISSIONS };

    case 'getApplicationStatus':
      return { ok: true, ...demoState.applicationStatus };

    case 'getSettings':
      return { ok: true, settings: demoState.settings };

    case 'loginStudent': {
      const studentNumber = formatStudentNumber(params.studentNumber);
      const pin = formatPin(params.pin);
      if (!studentNumber || studentNumber.length !== 4) {
        return { error: '학번 4자리를 정확히 입력해주세요.' };
      }
      if (!pin || pin.length !== 4) {
        return { error: '비밀번호 4자리를 정확히 입력해주세요.' };
      }

      let student = DEMO_STUDENTS.find(s => formatStudentNumber(s.studentNumber) === studentNumber);
      if (!student) {
        return { error: '등록되지 않은 학생입니다. 선생님께 명단 등록을 문의하세요.' };
      }
      // 첫 로그인인 경우: 입력된 비밀번호 자동 저장
      if (!demoState.pins[studentNumber]) {
        demoState.pins[studentNumber] = pin;
        return { ok: true, isFirstLogin: true, student };
      }
      // 기존 비밀번호가 있는 경우: 검증
      if (formatPin(demoState.pins[studentNumber]) !== pin) {
        return { error: '비밀번호가 일치하지 않습니다. (비밀번호 분실 시 선생님께 초기화를 요청하세요)' };
      }
      return { ok: true, student };
    }

    case 'setupPin': {
      const studentNumber = formatStudentNumber(params.studentNumber);
      const studentName = String(params.studentName || '').trim();
      const pin = formatPin(params.pin);
      if (demoState.pins[studentNumber]) {
        return { error: '이미 초기 비밀번호가 설정된 학생입니다. 로그인 화면에서 로그인해주세요. (비밀번호 분실 시 선생님께 초기화를 요청하세요)' };
      }
      let student = DEMO_STUDENTS.find(s => formatStudentNumber(s.studentNumber) === studentNumber);
      if (!student) {
        student = {
          studentId: 's' + studentNumber,
          studentNumber,
          studentName: studentName || '학생',
          classId: studentNumber.length >= 2 ? studentNumber.slice(0, 2) : '1-1'
        };
        DEMO_STUDENTS.push(student);
      } else if (studentName) {
        student.studentName = studentName;
      }
      demoState.pins[studentNumber] = pin;
      return { ok: true, student };
    }

    case 'updateStudentPin': {
      const { studentId, studentNumber, newPin } = params;
      const targetNumber = formatStudentNumber(studentNumber) || DEMO_STUDENTS.find(s => s.studentId === studentId)?.studentNumber;
      if (!targetNumber) return { error: '학생을 찾을 수 없습니다.' };
      demoState.pins[targetNumber] = formatPin(newPin);
      return { ok: true, message: '학생 비밀번호가 변경되었습니다.' };
    }

    case 'resetStudentPin': {
      const { studentId, studentNumber } = params;
      const targetNumber = formatStudentNumber(studentNumber) || DEMO_STUDENTS.find(s => s.studentId === studentId)?.studentNumber;
      if (targetNumber && demoState.pins[targetNumber] !== undefined) {
        delete demoState.pins[targetNumber];
      }
      return { ok: true, message: '학생 비밀번호가 성공적으로 초기화되었습니다.' };
    }

    case 'adminLogin': {
      const hash = params.passwordHash || params.password;
      if (hash === demoState.settings.ADMIN_PASSWORD_HASH || hash === 'e90f23b2bfa9a6dd6313364fa4e6777c98c0b533cb1b0fa3f6ce4048cfc526be') {
        return { ok: true };
      }
      return { error: '비밀번호가 일치하지 않습니다.' };
    }

    case 'getStudentHome': {
      const { studentId } = params;
      const received = demoState.requests.filter(r => r.toId === studentId && r.status === 'PENDING');
      const sent = demoState.requests.filter(r => r.fromId === studentId && r.status === 'PENDING');
      const pairs = demoState.pairs.filter(p => (p.studentA === studentId || p.studentB === studentId) && p.status === 'ACTIVE');
      const submissions = {};
      pairs.forEach(p => {
        submissions[p.pairId] = demoState.missionSubmissions.filter(s => s.pairId === p.pairId && s.status === 'APPROVED');
      });
      const results = demoState.results.filter(r => r.studentA === studentId || r.studentB === studentId);
      return {
        ok: true,
        receivedRequests: received,
        sentRequests: sent,
        pairs,
        missionSubmissions: submissions,
        results,
        applicationStatus: demoState.applicationStatus,
        subjects: DEMO_SUBJECTS,
        students: DEMO_STUDENTS,
        missions: DEMO_MISSIONS,
      };
    }

    case 'getReceivedRequests': {
      return { ok: true, requests: demoState.requests.filter(r => r.toId === params.studentId && r.status === 'PENDING') };
    }

    case 'getSentRequests': {
      return { ok: true, requests: demoState.requests.filter(r => r.fromId === params.studentId) };
    }

    case 'createPairRequest': {
      const { fromId, toId, subjectId, target } = params;
      if (fromId === toId) return { error: '자기 자신에게는 신청할 수 없습니다.' };
      if (!demoState.applicationStatus.globalOpen || !demoState.applicationStatus.subjects[subjectId]) {
        return { error: '응모가 마감되었습니다.' };
      }

      const activePairs = demoState.pairs.filter(p => p.status === 'ACTIVE');

      // 1인당 최대 2개 페어 허용
      const fromCount = activePairs.filter(p => p.studentA === fromId || p.studentB === fromId).length;
      if (fromCount >= 2) return { error: '이미 최대 페어(2개)를 모두 완료했습니다.' };

      const toCount = activePairs.filter(p => p.studentA === toId || p.studentB === toId).length;
      if (toCount >= 2) return { error: '해당 친구는 이미 최대 페어(2개)를 모두 완료했습니다.' };

      // [예외처리 1: 서로 다른 학생] 과목 불문 동일한 친구와 중복 페어 불가
      const alreadyWithFriend = activePairs.some(p =>
        (p.studentA === fromId && p.studentB === toId) || (p.studentA === toId && p.studentB === fromId)
      );
      if (alreadyWithFriend) {
        return { error: '이미 페어를 맺은 친구와는 두 번째 페어를 맺을 수 없습니다. (반드시 서로 다른 친구와 페어해야 합니다)' };
      }

      // [예외처리 2: 서로 다른 과목] 내가 이미 해당 과목 페어가 있는지
      const fromHasSubject = activePairs.some(p =>
        p.subjectId === subjectId && (p.studentA === fromId || p.studentB === fromId)
      );
      if (fromHasSubject) {
        return { error: '이미 해당 과목의 페어를 완료했습니다. (서로 다른 과목으로 페어해야 합니다)' };
      }

      // [예외처리 3: 서로 다른 과목] 상대방이 이미 해당 과목 페어가 있는지
      const toHasSubject = activePairs.some(p =>
        p.subjectId === subjectId && (p.studentA === toId || p.studentB === toId)
      );
      if (toHasSubject) {
        return { error: '해당 친구는 이미 해당 과목의 페어를 완료했습니다.' };
      }

      // 동일 상대에게 대기 중인 신청 검사
      const hasPending = demoState.requests.some(r =>
        r.subjectId === subjectId && r.status === 'PENDING' && r.fromId === fromId && r.toId === toId
      );
      if (hasPending) return { error: '이미 해당 친구에게 대기 중인 신청이 있습니다.' };

      const req = {
        requestId: 'req' + Date.now(),
        subjectId, fromId, toId, target: Number(target),
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      demoState.requests.push(req);
      return { ok: true, requestId: req.requestId };
    }

    case 'acceptPairRequest': {
      const { requestId, responderId } = params;
      const req = demoState.requests.find(r => r.requestId === requestId);
      if (!req) return { error: '신청을 찾을 수 없습니다.' };
      if (req.toId !== responderId) return { error: '권한이 없습니다.' };
      if (req.status !== 'PENDING') return { error: '이미 처리된 신청입니다.' };
      if (!demoState.applicationStatus.globalOpen || !demoState.applicationStatus.subjects[req.subjectId]) {
        return { error: '신청 변경 기간이 마감되었습니다.' };
      }

      const activePairs = demoState.pairs.filter(p => p.status === 'ACTIVE');

      // 최대 2개 페어 검사
      const fromCount = activePairs.filter(p => p.studentA === req.fromId || p.studentB === req.fromId).length;
      if (fromCount >= 2) {
        return { error: '신청 학생이 이미 최대 페어(2개)를 모두 완료했습니다.' };
      }
      const toCount = activePairs.filter(p => p.studentA === req.toId || p.studentB === req.toId).length;
      if (toCount >= 2) {
        return { error: '이미 최대 페어(2개)를 모두 완료했습니다.' };
      }

      // [예외처리 1: 서로 다른 학생] 과목 불문 동일한 친구와 중복 수락 차단
      const alreadyPartner = activePairs.some(p =>
        (p.studentA === req.fromId && p.studentB === req.toId) || (p.studentA === req.toId && p.studentB === req.fromId)
      );
      if (alreadyPartner) {
        return { error: '이미 해당 친구와 다른 과목에서 페어가 성사되어 있습니다. 페어는 반드시 서로 다른 학생과 맺어야 합니다.' };
      }

      // [예외처리 2: 서로 다른 과목] 수락자(나)가 이미 해당 과목 페어가 있는지 차단
      const toHasSubject = activePairs.some(p =>
        p.subjectId === req.subjectId && (p.studentA === req.toId || p.studentB === req.toId)
      );
      if (toHasSubject) {
        return { error: '이미 해당 과목의 페어를 완료하여, 같은 과목에 대한 다른 신청서는 수락할 수 없습니다.' };
      }

      // [예외처리 3: 서로 다른 과목] 신청 학생이 이미 해당 과목 페어가 있는지 차단
      const fromHasSubject = activePairs.some(p =>
        p.subjectId === req.subjectId && (p.studentA === req.fromId || p.studentB === req.fromId)
      );
      if (fromHasSubject) {
        return { error: '신청 학생이 이미 해당 과목의 페어를 완료하여 수락할 수 없습니다.' };
      }

      req.status = 'ACCEPTED';
      const pair = {
        pairId: 'pair' + Date.now(),
        subjectId: req.subjectId,
        studentA: req.fromId,
        studentB: req.toId,
        target: req.target,
        baseRange: 5,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      demoState.pairs.push(pair);

      // 성사 후 정리 작업:
      // 이미 페어가 맺어진 두 사람 사이의 다른 과목 PENDING 신청만 취소
      demoState.requests.forEach(r => {
        if (r.requestId !== requestId && r.status === 'PENDING') {
          const betweenBoth = (r.fromId === req.fromId && r.toId === req.toId) || (r.fromId === req.toId && r.toId === req.fromId);
          if (betweenBoth) r.status = 'CANCELLED';
        }
      });

      return { ok: true, pairId: pair.pairId };
    }

    case 'rejectPairRequest': {
      const req = demoState.requests.find(r => r.requestId === params.requestId);
      if (!req) return { error: '신청을 찾을 수 없습니다.' };
      if (req.toId !== params.responderId) return { error: '권한이 없습니다.' };
      req.status = 'REJECTED';
      return { ok: true };
    }

    case 'cancelPairRequest': {
      const req = demoState.requests.find(r => r.requestId === params.requestId);
      if (!req) return { error: '신청을 찾을 수 없습니다.' };
      if (req.fromId !== params.studentId) return { error: '권한이 없습니다.' };
      req.status = 'CANCELLED';
      return { ok: true };
    }

    case 'cancelPair': {
      const { pairId, studentId } = params;
      const pair = demoState.pairs.find(p => p.pairId === pairId);
      if (!pair) return { error: '페어 정보를 찾을 수 없습니다.' };
      if (pair.studentA !== studentId && pair.studentB !== studentId) {
        return { error: '권한이 없습니다.' };
      }
      // 수정 불가능한 기간인지 검사
      const isGlobalOpen = demoState.applicationStatus.globalOpen;
      const isSubjectOpen = demoState.applicationStatus.subjects[pair.subjectId] !== false;
      if (!isGlobalOpen || !isSubjectOpen) {
        return { error: '신청 변경 기간이 마감되어 페어를 수정할 수 없습니다.' };
      }

      // 페어 해제 (상태를 CANCELLED로 변경)
      pair.status = 'CANCELLED';
      return { ok: true, message: '페어가 성공적으로 해제되었습니다.' };
    }

    case 'getMyPairs': {
      return { ok: true, pairs: demoState.pairs.filter(p => (p.studentA === params.studentId || p.studentB === params.studentId) && p.status === 'ACTIVE') };
    }

    case 'getMissionStatus': {
      return { ok: true, submissions: demoState.missionSubmissions.filter(s => s.pairId === params.pairId && s.status === 'APPROVED') };
    }

    case 'submitMission': {
      let fileUrl = '';
      if (params.base64) {
        fileUrl = params.base64.startsWith('data:')
          ? params.base64
          : `data:${params.mimeType || 'image/jpeg'};base64,${params.base64}`;
      }
      const sub = {
        submissionId: 'sub' + Date.now(),
        pairId: params.pairId,
        subjectId: params.subjectId,
        missionId: params.missionId,
        uploaderId: params.uploaderId,
        fileUrl: fileUrl,
        status: 'APPROVED',
        submittedAt: new Date().toISOString()
      };
      demoState.missionSubmissions.push(sub);
      return { ok: true, submissionId: sub.submissionId };
    }

    case 'addSubject': {
      const name = String(params.subjectName || '').trim();
      if (!name) return { error: '과목명을 입력해주세요.' };
      const maxScore = Number(params.maxScore || 100);
      const subjectId = params.subjectId || ('sub_' + Date.now());
      const newSub = { subjectId, subjectName: name, maxScore, active: true };
      DEMO_SUBJECTS.push(newSub);
      demoState.applicationStatus.subjects[subjectId] = true;
      return { ok: true, subject: newSub };
    }

    case 'deleteSubject': {
      const subjectId = params.subjectId;
      const idx = DEMO_SUBJECTS.findIndex(s => s.subjectId === subjectId);
      if (idx >= 0) {
        DEMO_SUBJECTS.splice(idx, 1);
        delete demoState.applicationStatus.subjects[subjectId];
      }
      return { ok: true };
    }

    case 'previewAutoMatch': {
      const activePairs = demoState.pairs.filter(p => p.status === 'ACTIVE');
      const activeSubjects = DEMO_SUBJECTS.filter(s => s.active);

      if (activeSubjects.length === 0) {
        return { error: '활성화된 과목이 없습니다.' };
      }

      const studentMeta = {};
      DEMO_STUDENTS.forEach(s => {
        studentMeta[s.studentId] = {
          student: s,
          pairCount: 0,
          pairedSubjects: new Set(),
          pairedPartners: new Set(),
        };
      });

      activePairs.forEach(p => {
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

      const candidateIds = Object.keys(studentMeta).filter(id => studentMeta[id].pairCount < 2);
      if (candidateIds.length < 2) {
        return {
          ok: true,
          previewPairs: [],
          unpairedStudents: candidateIds.map(id => studentMeta[id].student),
          message: '자동 매칭 대상 학생이 2명 미만입니다.'
        };
      }

      const shuffledIds = [...candidateIds].sort(() => Math.random() - 0.5);
      const previewPairs = [];
      const assignedInRound = new Set();

      for (let i = 0; i < shuffledIds.length; i++) {
        const idA = shuffledIds[i];
        if (assignedInRound.has(idA)) continue;
        if (studentMeta[idA].pairCount >= 2) continue;

        let partnerId = null;
        let chosenSubjectId = null;

        for (let j = i + 1; j < shuffledIds.length; j++) {
          const idB = shuffledIds[j];
          if (assignedInRound.has(idB)) continue;
          if (studentMeta[idB].pairCount >= 2) continue;

          // 1. 서로 다른 학생
          if (studentMeta[idA].pairedPartners.has(idB) || studentMeta[idB].pairedPartners.has(idA)) {
            continue;
          }

          // 2. 서로 다른 과목 (둘 다 아직 하지 않은 과목)
          const commonSubs = activeSubjects.filter(s =>
            !studentMeta[idA].pairedSubjects.has(s.subjectId) &&
            !studentMeta[idB].pairedSubjects.has(s.subjectId)
          );

          if (commonSubs.length > 0) {
            partnerId = idB;
            chosenSubjectId = commonSubs[0].subjectId;
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

      const unpairedStudents = DEMO_STUDENTS.filter(s =>
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

    case 'saveAutoMatchedPairs': {
      const listToSave = params.pairs || [];
      if (!Array.isArray(listToSave) || listToSave.length === 0) {
        return { error: '저장할 매칭 데이터가 없습니다.' };
      }

      const activePairs = demoState.pairs.filter(p => p.status === 'ACTIVE');
      const studentPairCount = {};
      const studentSubjects = {};
      const pairPartners = new Set();

      activePairs.forEach(p => {
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
      for (let i = 0; i < listToSave.length; i++) {
        const { studentA, studentB, subjectId, target } = listToSave[i];
        if (!studentA || !studentB || !subjectId) continue;
        if (studentA === studentB) {
          return { error: `[#${i + 1}팀] 동일한 학생끼리는 페어를 맺을 수 없습니다.` };
        }
        if ((studentPairCount[studentA] || 0) >= 2) {
          return { error: `[#${i + 1}팀] 학생은 이미 2개 페어가 완료되었습니다.` };
        }
        if ((studentPairCount[studentB] || 0) >= 2) {
          return { error: `[#${i + 1}팀] 학생은 이미 2개 페어가 완료되었습니다.` };
        }
        if (pairPartners.has(`${studentA}::${studentB}`)) {
          return { error: `[#${i + 1}팀] 두 학생은 이미 페어되어 있어 중복 매칭할 수 없습니다.` };
        }
        if (studentSubjects[studentA] && studentSubjects[studentA].has(subjectId)) {
          return { error: `[#${i + 1}팀] 학생은 이미 해당 과목 페어가 있습니다.` };
        }
        if (studentSubjects[studentB] && studentSubjects[studentB].has(subjectId)) {
          return { error: `[#${i + 1}팀] 학생은 이미 해당 과목 페어가 있습니다.` };
        }

        studentPairCount[studentA] = (studentPairCount[studentA] || 0) + 1;
        studentPairCount[studentB] = (studentPairCount[studentB] || 0) + 1;
        if (!studentSubjects[studentA]) studentSubjects[studentA] = new Set();
        if (!studentSubjects[studentB]) studentSubjects[studentB] = new Set();
        studentSubjects[studentA].add(subjectId);
        studentSubjects[studentB].add(subjectId);
        pairPartners.add(`${studentA}::${studentB}`);
        pairPartners.add(`${studentB}::${studentA}`);

        demoState.pairs.push({
          pairId: 'pair_auto_' + Date.now() + '_' + i,
          subjectId,
          studentA,
          studentB,
          target: Number(target || 180),
          baseRange: 5,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
        savedCount++;
      }

      return { ok: true, savedCount, message: `${savedCount}개의 페어가 성공적으로 저장되었습니다.` };
    }

    case 'autoMatchUnpairedStudents': {
      const previewRes = handleDemoApi('previewAutoMatch', params);
      if (!previewRes.ok || previewRes.previewPairs.length === 0) {
        return previewRes;
      }
      return handleDemoApi('saveAutoMatchedPairs', { pairs: previewRes.previewPairs });
    }

    case 'setGlobalApplicationStatus': {
      demoState.applicationStatus.globalOpen = params.open;
      if (!params.open) {
        Object.keys(demoState.applicationStatus.subjects).forEach(k => {
          demoState.applicationStatus.subjects[k] = false;
        });
      }
      return { ok: true };
    }

    case 'setSubjectApplicationStatus': {
      demoState.applicationStatus.subjects[params.subjectId] = params.open;
      return { ok: true };
    }

    case 'getAllPairs':
      return { ok: true, pairs: demoState.pairs };

    case 'getAllRequests':
      return { ok: true, requests: demoState.requests };

    case 'getAllMissionSubmissions':
      return { ok: true, submissions: demoState.missionSubmissions };

    case 'getDashboardStats': {
      const activePairs = demoState.pairs.filter(p => p.status === 'ACTIVE');
      const completedMissions = demoState.missionSubmissions.filter(s => s.status === 'APPROVED');
      const studentsWithPairs = new Set();
      activePairs.forEach(p => { studentsWithPairs.add(p.studentA); studentsWithPairs.add(p.studentB); });
      return {
        ok: true,
        stats: {
          totalStudents: DEMO_STUDENTS.length,
          activePairs: activePairs.length,
          pendingRequests: demoState.requests.filter(r => r.status === 'PENDING').length,
          completedMissions: completedMissions.length,
          studentsWithoutPairs: DEMO_STUDENTS.length - studentsWithPairs.size,
          resultsUploaded: demoState.examResults.length > 0,
          winCount: demoState.results.filter(r => r.result === 'WIN' || r.result === 'JACKPOT').length,
        }
      };
    }

    case 'deletePair': {
      const pair = demoState.pairs.find(p => p.pairId === params.pairId);
      if (pair) pair.status = 'CANCELLED';
      return { ok: true };
    }

    case 'updatePairTarget': {
      const pair = demoState.pairs.find(p => p.pairId === params.pairId);
      if (pair) pair.target = Number(params.newTarget);
      return { ok: true };
    }

    case 'revokeMission': {
      const sub = demoState.missionSubmissions.find(s => s.submissionId === params.submissionId);
      if (sub) sub.status = 'REVOKED';
      return { ok: true };
    }

    case 'uploadExamResults': {
      const { data } = params;
      demoState.examResults = data;
      return { ok: true, count: data.length };
    }

    case 'calculateResults': {
      const results = [];
      demoState.pairs.filter(p => p.status === 'ACTIVE').forEach(pair => {
        const scoreA = demoState.examResults.find(e => e.studentId === pair.studentA && e.subjectId === pair.subjectId);
        const scoreB = demoState.examResults.find(e => e.studentId === pair.studentB && e.subjectId === pair.subjectId);
        if (!scoreA || !scoreB) return;
        const sum = Number(scoreA.score) + Number(scoreB.score);
        const missionCount = demoState.missionSubmissions.filter(s => s.pairId === pair.pairId && s.status === 'APPROVED').length;
        const finalRange = pair.baseRange + missionCount;
        let result;
        if (sum === pair.target) result = 'JACKPOT';
        else if (Math.abs(sum - pair.target) <= finalRange) result = 'WIN';
        else if (Math.abs(sum - pair.target) <= finalRange + 3) result = 'NEAR_MISS';
        else result = 'MISS';
        results.push({
          pairId: pair.pairId,
          subjectId: pair.subjectId,
          studentA: pair.studentA,
          studentB: pair.studentB,
          scoreA: Number(scoreA.score),
          scoreB: Number(scoreB.score),
          sum,
          target: pair.target,
          missionCount,
          finalRange,
          rangeMin: pair.target - finalRange,
          rangeMax: pair.target + finalRange,
          result,
        });
      });
      demoState.results = results;
      return { ok: true, results };
    }

    case 'getAllResults':
      return { ok: true, results: demoState.results };

    case 'getStudentResults': {
      return { ok: true, results: demoState.results.filter(r => r.studentA === params.studentId || r.studentB === params.studentId) };
    }

    case 'uploadStudents': {
      // 데모에서는 무시
      return { ok: true };
    }

    case 'uploadSubjects': {
      return { ok: true };
    }

    case 'updateMissions': {
      return { ok: true };
    }

    case 'updateSettings': {
      Object.assign(demoState.settings, params.settings);
      return { ok: true };
    }

    case 'resetAllRecords': {
      demoState.requests = [];
      demoState.pairs = [];
      demoState.missionSubmissions = [];
      demoState.examResults = [];
      demoState.results = [];
      return { ok: true, message: '모든 기록이 초기화되었습니다.' };
    }

    default:
      return { error: `알 수 없는 액션: ${action}` };
  }
}
