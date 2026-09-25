# PAIR LOTTO 🎰

시험기간에 학생 2명이 한 팀이 되어 과목별 합산 목표점수를 예측하고, PAIR MISSION으로 당첨 범위를 넓히는 학급활동 웹앱입니다.

## 프로젝트 구조

```
짝꿍 로또/
├── index.html              # 루트 HTML (Vite 엔트리)
├── package.json            # 프로젝트 설정
├── vite.config.js          # Vite 빌드 설정
├── .env                    # 환경변수 (API URL 설정)
├── .env.example            # 환경변수 예시
├── Code.gs                 # Google Apps Script 전체 코드
│
├── src/
│   ├── main.js             # 앱 엔트리 포인트 (뷰 라우팅)
│   ├── config.js           # 설정값 관리 (TARGET, RANGE 등)
│   ├── state.js            # 전역 상태 관리 + 세션
│   │
│   ├── services/
│   │   ├── index.js        # API 통합 래퍼 (실제/데모 자동 전환)
│   │   ├── api.js          # Apps Script API 호출 함수
│   │   └── demoData.js     # 데모 모드 데이터 + 핸들러
│   │
│   ├── views/
│   │   ├── Login.js        # 학생 로그인 (학번 + PIN)
│   │   ├── Student.js      # 학생 메인 화면
│   │   ├── AdminLogin.js   # 관리자 로그인
│   │   └── Admin.js        # 관리자 대시보드
│   │
│   ├── utils/
│   │   └── helpers.js      # 유틸리티 (DOM, 이미지, CSV, 토스트)
│   │
│   └── styles/
│       └── index.css       # 메인 스타일시트
│
└── prototype-backup/       # 원본 프로토타입 백업
```

## 각 파일의 역할

| 파일 | 역할 |
|------|------|
| `src/config.js` | TARGET 후보, 당첨범위, 이미지 크기 등 모든 설정값 |
| `src/state.js` | 앱 상태 + localStorage 세션 관리 |
| `src/services/index.js` | API_URL 유무에 따라 실제/데모 자동 전환 |
| `src/services/api.js` | Apps Script 호출 함수 모음 |
| `src/services/demoData.js` | 오프라인 데모 데이터 + 인메모리 핸들러 |
| `src/views/Login.js` | 학번+PIN 로그인 / 최초 PIN 설정 |
| `src/views/Student.js` | 학생 홈 (받은 신청, 응모권, 새 신청, 미션, 결과) |
| `src/views/AdminLogin.js` | 관리자 비밀번호 입력 |
| `src/views/Admin.js` | 관리자 대시보드 (9개 탭) |
| `src/utils/helpers.js` | 이미지 리사이즈, CSV 파싱, 토스트, 모달 |
| `Code.gs` | Google Apps Script 전체 백엔드 코드 |

---

## Google Sheets에 만들어야 할 시트

### 1. SETTINGS
| key | value |
|-----|-------|
| APPLICATION_OPEN | TRUE |
| BASE_RANGE | 5 |
| BONUS_PER_MISSION | 1 |
| NEAR_MISS_RANGE | 3 |
| TARGET_OPTIONS | 100,120,140,160,180,200 |

### 2. STUDENTS
| studentId | studentNumber | studentName | classId | pinHash |
|-----------|---------------|-------------|---------|---------|
| s2201 | 2201 | 홍길동 | 2-2 | |

### 3. SUBJECTS
| subjectId | subjectName | maxScore | active |
|-----------|-------------|----------|--------|
| korean | 국어 | 100 | TRUE |
| english | 영어 | 100 | TRUE |
| math | 수학 | 100 | TRUE |
| science | 과학 | 100 | TRUE |

### 4. PAIR_REQUESTS
| requestId | subjectId | fromId | toId | target | status | createdAt |

### 5. PAIRS
| pairId | subjectId | studentA | studentB | target | baseRange | status | createdAt |

### 6. MISSIONS
| missionId | missionNo | title | description |
|-----------|-----------|-------|-------------|
| mission01 | 1 | MISSION 01 · 시험 예상 문제 공유 | 각자 예상 문제... |

### 7. MISSION_SUBMISSIONS
| submissionId | pairId | subjectId | missionId | uploaderId | fileId | fileUrl | status | submittedAt |

### 8. EXAM_RESULTS
| studentId | subjectId | score | uploadedAt |

### 9. RESULTS
| pairId | subjectId | studentA | studentB | scoreA | scoreB | sum | target | missionCount | finalRange | rangeMin | rangeMax | result |

---

## Apps Script 배포 방법

1. [Google Apps Script](https://script.google.com) 에서 새 프로젝트를 만듭니다.
2. `Code.gs` 파일 내용을 전부 복사하여 붙여넣습니다.
3. **프로젝트 설정 > 스크립트 속성**에 다음을 추가합니다:

| 속성 | 값 |
|------|-----|
| `SPREADSHEET_ID` | Google Sheets 문서 ID |
| `MISSION_FOLDER_ID` | 미션 사진 저장용 Google Drive 폴더 ID |
| `ADMIN_PASSWORD` | 관리자 비밀번호 (원하는 값) |

4. Apps Script 에디터에서 `initializeSheets` 함수를 한 번 실행하여 시트를 초기화합니다.
5. **배포 > 새 배포 > 웹 앱**으로 배포합니다:
   - 실행 주체: **나**
   - 액세스: **모든 사용자**
6. 배포된 웹 앱 URL을 복사합니다.

## Apps Script Web App URL 입력 위치

프로젝트 루트의 `.env` 파일에 입력합니다:

```
VITE_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Google Drive Folder ID 입력 위치

Apps Script **프로젝트 설정 > 스크립트 속성**에 입력합니다:

```
MISSION_FOLDER_ID = 여기에_Google_Drive_폴더_ID_입력
```

## 관리자 비밀번호 설정 위치

Apps Script **프로젝트 설정 > 스크립트 속성**에 입력합니다:

```
ADMIN_PASSWORD = 원하는_비밀번호
```

---

## 로컬 개발

```bash
npm install
npm run dev
```

`.env`에 `VITE_APPS_SCRIPT_API_URL`이 비어있으면 **데모 모드**로 동작합니다.

## Vercel 배포

```bash
npx vercel --prod --yes
```

Vercel 환경변수에 `VITE_APPS_SCRIPT_API_URL`을 설정해야 합니다.

---

## 테스트용 학생 데이터

| 학번 | 이름 |
|------|------|
| 2201 | 홍길동 |
| 2202 | 김민수 |
| 2203 | 박지훈 |
| 2204 | 이도윤 |
| 2205 | 최현우 |
| 2206 | 정우진 |
| 2207 | 강서준 |
| 2208 | 윤지호 |
| 2209 | 조예린 |
| 2210 | 한소희 |
| 2211 | 배수진 |
| 2212 | 송하은 |

데모 모드 관리자 비밀번호: `1234`

## 테스트 순서

1. 로컬 서버 시작 (`npm run dev`)
2. 학생 A (2201 홍길동)로 로그인 → PIN 설정
3. 학생 A가 과학 과목에서 학생 B (2202 김민수)에게 TARGET 180점 PAIR 신청
4. 학생 B (2202 김민수)로 로그인 → 받은 신청 확인 → 수락
5. 학생 A 새로고침 → PAIR 성사 확인
6. 학생 A 또는 B → PAIR MISSION 사진 인증
7. 관리자 모드 (비밀번호: 1234)로 로그인
8. 응모 관리 → 전체 CLOSE
9. 학생 화면 → 신청/수정 불가 확인
10. 관리자 → 시험 점수 CSV 업로드 → 자동 판정
11. 학생 화면 → 결과 확인

---

## 운영 규칙

- 응모 OPEN 중: 신청/취소/재신청 가능
- 응모 CLOSE 후: 신청/수정/취소 불가, 미션 인증은 가능
- 관리자: CLOSE 상태에서도 PAIR 수정/삭제 가능
- 같은 과목에서 학생 1명당 ACTIVE PAIR 1개만 허용
- 미션 사진은 자동 승인, 교사가 필요 시 취소
- 사진 파일은 Google Drive, 상태/URL만 Sheets에 저장
