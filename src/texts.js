/**
 * ====================================================================
 * PAIR LOTTO 웹앱 텍스트 설정 파일 (texts.js)
 * ====================================================================
 * 웹앱에 표시되는 모든 안내 문구, 타이틀, 버튼 텍스트, 안내 메시지를
 * 이 파일에서 한눈에 확인하고 자유롭게 수정할 수 있습니다.
 * 문구를 변경하면 웹앱의 해당 위치에 즉시 반영됩니다.
 */

export const TEXTS = {
  // 1. 공통 및 브랜드
  brand: {
    appTitle: 'PAIR LOTTO',
    appSubtitle: '시험기간 점수 예측 활동',
    slogan: 'MATCH YOUR SCORE. WIN TOGETHER.',
    adminBadge: '관리자 모드',
    footerCopyright: 'PAIR LOTTO · 시험기간 협동 학습 로또 프로젝트',
  },

  // 2. 로그인 및 접속 안내
  login: {
    howToPlayTitle: 'PAIR LOTTO 진행 방식',
    howToPlayBadge: '⚡ HOW TO PLAY',
    step1Title: '친구와 페어 맺기',
    step1Desc: '공부 짝꿍과 과목별 목표 합산 점수(TARGET)를 정해 신청해요 (1인당 최대 2개 페어 가능)',
    step2Title: '퀘스트 인증 & 버프 UP',
    step2Desc: '예상문제 공유, 오답정리 사진을 인증하면 당첨 오차 범위(BONUS)가 넓어져요',
    step3Title: '시험 후 로또 결과 오픈!',
    step3Desc: '성적 발표 후 두 사람 점수 합계가 TARGET 범위에 들면 JACKPOT 당첨!',

    studentNumberLabel: '학번 (4자리)',
    studentNumberPlaceholder: '예: 2201',
    pinLabel: '비밀번호 (4자리)',
    pinPlaceholder: '비밀번호 입력',
    pinNotice: '※ 첫 로그인 시 입력한 비밀번호가 저장됩니다. 꼭 기억하세요!',
    loginButton: '로그인',
    firstTimeButton: '처음이에요 (초기 비밀번호 설정)',

    setupGuideTitle: '⚠️ 초기 비밀번호 필수 안내',
    setupGuideText: '설정한 초기 비밀번호는 앞으로 로그인할 때 계속 사용되므로 꼭 기억하고 있어야 합니다!',
    nameLabel: '이름',
    namePlaceholder: '이름 입력',
    setupPinLabel: '초기 비밀번호 (4자리 숫자)',
    setupPinConfirmLabel: '초기 비밀번호 확인',
    setupSubmitButton: '초기 비밀번호 설정하고 시작',
    backToLoginButton: '돌아가기',
  },

  // 3. 학생 화면 (단계별 카드 & HUD)
  student: {
    hud: {
      pairLabel: 'PAIR STATUS',
      missionLabel: 'MISSION STATUS',
      resultLabel: 'RESULT STATUS',
      waiting: '대기 중 🔒',
      ready: 'READY (0/2)',
      revealed: 'REVEALED 🏆',
    },
    step1: {
      title: '📬 STEP 1 &nbsp; 도착한 페어 신청',
      empty: '도착한 짝꿍 신청이 없습니다.',
      acceptBtn: '✅ 수락',
      rejectBtn: '거절',
      requestTag: 'CHALLENGE REQUEST',
    },
    step2: {
      title: '🎟️ STEP 2 &nbsp; 나의 PAIR LOTTO 응모권',
      badge: '최대 2개 페어 가능',
      empty: '과목 데이터를 불러오는 중...',
      unmatchedTitle: '아직 매칭된 짝꿍이 없어요.',
      unmatchedDesc: '아래 [나의 짝꿍 선택하기]에서 친구에게 신청해보세요!',
      waitingResponseBadge: '⏳ 응답 대기 중',
      breakPairBtn: '페어 끊기',
      cancelRequestBtn: '신청 취소',
      baseRangeText: '기본 당첨범위',
    },
    step3: {
      title: '💑 STEP 3 &nbsp; 나의 짝꿍 선택하기',
      subjectLabel: '도전할 과목',
      friendLabel: '함께할 짝꿍',
      targetLabel: '목표 합산점수',
      friendSelectDefault: '-- 친구 선택 --',
      previewTag: '매칭 미리보기',
      previewFriendPlaceholder: '친구를 선택하세요',
      sendRequestBtn: '페어 신청 보내기',
      sendingBtn: '신청 중...',
      helpDefault: '신청 기간에는 언제든지 짝꿍을 바꾸거나 취소할 수 있어요.',
      helpMaxPairs: '⚠️ 짝꿍 2명을 모두 선택했어요. 바꾸려면 위 티켓에서 [페어 끊기]를 먼저 해주세요.',
      helpOnePairLeft: '✨ 1개의 페어가 완료되었어요. 추가로 1명 더 짝꿍을 맺을 수 있어요!',
      helpClosed: '🔒 신청 기간이 마감되어 새로운 신청을 할 수 없습니다.',
      badgeClosed: '신청 마감',
      badgeComplete: '페어 완료 (2/2)',
      badgeAvailable: '신청 가능 (최대 2개)',
      badgeOneMore: '1개 완료 (1개 추가 가능)',
    },
    step4: {
      title: '🎯 STEP 4 &nbsp; 페어 미션 퀘스트',
      badgeWaiting: '미션 대기',
      emptyText: '짝꿍과 매칭되면 미션 퀘스트가 열려요!',
      uploadBtn: '📷 사진 인증하기',
      completedBadge: '✅ 완료',
      bonusBannerTitle: '🔥 미션 보너스 당첨 범위',
    },
    step5: {
      title: '🏆 STEP 5 &nbsp; PAIR LOTTO 결과 확인',
      badgeWaiting: '결과 대기',
      emptyText: '선생님이 시험 점수를 입력하면 당첨 결과를 확인할 수 있어요!',
      revealBtn: 'PAIR LOTTO 결과 확인',
      rollingText: '🎰 ROLLING...',
      readyText: '결과 발표가 준비되었습니다!',
    },
    modals: {
      breakPairConfirm: '정말로 이 친구와의 페어를 끊으시겠습니까?\n\n* 신청 변경 기간 동안에는 자유롭게 페어를 끊고 새로운 친구와 다시 페어할 수 있습니다.',
      breakPairSuccess: '페어가 성공적으로 해제되었습니다. 새로운 친구와 페어할 수 있습니다.',
      acceptConfirm: '이 PAIR 신청을 수락하시겠습니까?\n수락 시 정식 페어가 성사됩니다.',
      rejectConfirm: '이 신청을 거절하시겠습니까?',
      cancelConfirm: '이 신청을 취소하시겠습니까?',
    }
  },

  // 4. 관리자(선생님) 화면
  admin: {
    menu: {
      dashboard: '대시보드',
      students: '학생 관리',
      subjects: '과목 관리',
      application: '응모 관리',
      pairs: 'PAIR 현황',
      missions: '미션 인증',
      scores: '시험 점수',
      results: '당첨 결과',
      settings: '설정',
    },
    dashboard: {
      title: 'PAIR LOTTO 운영 대시보드',
      subtitle: '응모 상태, 미션 인증, 시험 결과와 당첨 현황을 한 번에 관리합니다.',
      totalStudents: '전체 학생',
      activePairs: '성사 PAIR',
      pendingRequests: '대기 신청',
      completedMissions: '미션 완료',
      unmatchedStudents: '미응모 학생',
      scoreUploadStatus: '점수 업로드',
      winningPairs: '당첨 PAIR',
      currentStatus: '현재 상태',
      closeAllBtn: '🔒 전체 응모 마감',
      openAllBtn: '🔓 전체 응모 다시 열기',
      autoMatchBtn: '🎲 미응모 학생 자동 매칭 (소외 방지)',
    },
    students: {
      title: '👥 학생 목록',
      uploadTitle: '📤 학생 명단 업로드 (엑셀 / CSV)',
      resetPinBtn: '🔄 비밀번호 초기화',
      tableHeaders: ['학번', '이름', 'PAIR 수', '비밀번호 관리'],
      uploadHelp: '엑셀(.xlsx, .xls) 또는 CSV 파일을 지원합니다. 학번과 이름 컬럼이 포함되어 있으면 자동으로 인식합니다.',
      resetConfirm: '학생의 비밀번호를 초기화하시겠습니까?\n초기화하면 학생이 로그인 화면에서 [처음이에요] 버튼을 통해 새 비밀번호를 다시 설정할 수 있습니다.',
      resetSuccess: '학생의 비밀번호가 초기화되었습니다. 학생이 새 비밀번호를 재설정할 수 있습니다.',
    },
    subjects: {
      title: '📚 과목 관리',
      addTitle: '➕ 새 과목 추가',
      nameLabel: '과목명',
      namePlaceholder: '예: 국어, 도덕, 정보 등',
      maxScoreLabel: '만점',
      addBtn: '과목 추가하기',
      deleteBtn: '삭제',
      deleteConfirm: '과목을 정말로 삭제하시겠습니까?',
      tableHeaders: ['과목명', '만점', '상태', '관리'],
      autoIdNotice: '💡 과목 ID는 시스템에서 자동으로 생성되므로 영어로 입력하실 필요가 없습니다.',
    },
    scores: {
      title: '📊 시험 결과 업로드',
      badge: '엑셀 / CSV 지원',
      uploadBtn: '업로드 후 자동 판정',
      help: '형식: 엑셀 파일(.xlsx, .xls) 또는 CSV 파일. 첫 행에 학번과 과목명(국어, 영어, 수학 등)이 적힌 성적표를 그대로 업로드하세요.',
    },
    missions: {
      title: '📷 미션 인증 확인',
      badge: '기본 자동 승인 · 필요 시 취소',
      empty: '아직 제출된 미션이 없습니다.',
      revokeBtn: '인증 취소',
      revokeConfirm: '이 미션 인증을 취소하시겠습니까?',
      noPhoto: '사진 미제출',
      viewFullPhoto: '사진 크게 보기',
    },
    pairs: {
      title: '🤝 PAIR 현황',
      pendingTitle: '📨 대기 중인 신청',
      autoMatchNotice: '아직 짝꿍을 찾지 못한 학생들을 서로 자동으로 연결하여 소외되는 학생이 없도록 합니다.',
    }
  }
};
