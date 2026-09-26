/**
 * PAIR LOTTO 설정 파일
 * 모든 설정값을 여기에서 관리합니다.
 * 코드 내부에 숫자를 하드코딩하지 않도록 이 파일을 사용하세요.
 */

/** Apps Script Web App URL - 배포 후 여기에 입력 */
export const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL || 'https://script.google.com/macros/s/AKfycbzKbMuIyu45HW_wt0YdWaqmhvKEMaZvPbLQ07fdjyJuB80tEKr8AY0WIuou3Zg3WCcR2w/exec';

/** Google Drive 미션 사진 폴더 ID - Apps Script에서 설정 */
export const DRIVE_FOLDER_ID = '1aqPUUjQbMTllHDx0HYiKSVJvWY3ymvPR';

/** Polling 주기 (ms) - 학생 화면 실시간 자동 동기화 (5초) */
export const POLL_INTERVAL = 5000;

/** TARGET 점수 후보 목록 */
export const TARGET_OPTIONS = [100, 120, 140, 160, 180, 200];

/** 기본 당첨 범위 (±점) */
export const BASE_RANGE = 5;

/** PAIR MISSION당 추가 범위 */
export const BONUS_PER_MISSION = 1;

/** NEAR MISS 판정 범위 (당첨범위 밖 N점 이내) */
export const NEAR_MISS_RANGE = 3;

/** 최대 업로드 이미지 크기 (px) - 프론트에서 리사이즈 */
export const MAX_IMAGE_SIZE = 1200;

/** 최대 업로드 이미지 품질 (0~1) */
export const IMAGE_QUALITY = 0.7;

/** 학번 자리수 */
export const STUDENT_NUMBER_DIGITS = 4;

/** 앱 버전 */
export const APP_VERSION = '1.2.0';
