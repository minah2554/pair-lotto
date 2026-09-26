/**
 * PAIR LOTTO 유틸리티 함수
 */
import { MAX_IMAGE_SIZE, IMAGE_QUALITY } from '../config.js';

/** 날짜를 한국어 형식으로 표시 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 순수 JS SHA-256 구현 (crypto.subtle 비지원 환경 대비 폴백) */
function pureSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x3910c403, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = true;
  const wordsLength = (asciiBitLength + 64 >>> 9 << 4) + 15;
  for (i = 0; i < wordsLength; i++) words[i] = 0;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) compositeClearHex = false;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[ascii[lengthProperty] >> 2] |= 0x80 << ((3 - ascii[lengthProperty]) % 4) * 8;
  words[wordsLength] = asciiBitLength;

  for (j = 0; j < wordsLength; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash;
    hash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

/** SHA-256 해시 함수 (crypto.subtle 우선, 미지원 시 순수 JS 폴백) */
export async function sha256(message) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    // Web Crypto 실패 시 순수 JS 폴백으로 안전하게 처리
  }
  return pureSha256(message);
}

/** 숫자를 4자리 학번으로 포맷 */
export function formatStudentNumber(num) {
  return String(num).padStart(4, '0');
}

/** 학번에서 반/번호 추출 (예: 2201 → 2반 1번) */
export function parseStudentNumber(num) {
  const s = String(num).padStart(4, '0');
  return { class: parseInt(s.slice(0, 2)), number: parseInt(s.slice(2)) };
}

/** 이미지 파일을 리사이즈하여 Base64로 변환 */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // MAX_IMAGE_SIZE에 맞춰 리사이즈
        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_IMAGE_SIZE;
            width = MAX_IMAGE_SIZE;
          } else {
            width = (width / height) * MAX_IMAGE_SIZE;
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
        resolve({
          base64: base64.split(',')[1],
          mimeType: 'image/jpeg',
          fullDataUrl: base64
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** CSV 텍스트를 배열로 파싱 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
  return { headers, rows };
}

/** DOM 엘리먼트 생성 헬퍼 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (key === 'htmlContent') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  return element;
}

/** 화면 전환 애니메이션 */
export function fadeTransition(container, renderFn) {
  container.style.opacity = '0';
  container.style.transform = 'translateY(10px)';
  setTimeout(() => {
    renderFn();
    requestAnimationFrame(() => {
      container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    });
  }, 150);
}

/** 토스트 메시지 표시 */
export function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = el('div', {
    className: `toast toast-${type}`,
    htmlContent: message
  });
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** 확인 다이얼로그 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = el('div', { className: 'modal-overlay' });
    const modal = el('div', { className: 'modal-box' },
      el('p', { className: 'modal-message' }, message),
      el('div', { className: 'modal-actions' },
        el('button', {
          className: 'btn btn-ghost',
          onClick: () => { overlay.remove(); resolve(false); }
        }, '취소'),
        el('button', {
          className: 'btn btn-primary',
          onClick: () => { overlay.remove(); resolve(true); }
        }, '확인')
      )
    );
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  });
}

/** 알림 팝업 모달 */
export function showAlertModal(message, title = '안내') {
  return new Promise((resolve) => {
    const existing = document.querySelector('.alert-modal-overlay');
    if (existing) existing.remove();

    const overlay = el('div', { className: 'modal-overlay alert-modal-overlay' });
    const modal = el('div', { className: 'modal-box' },
      el('div', { className: 'modal-head', style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' } },
        el('span', { style: { fontSize: '24px' } }, '⚠️'),
        el('h4', { style: { fontSize: '18px', fontWeight: '700', color: 'var(--text)' } }, title)
      ),
      el('p', { className: 'modal-message', style: { whiteSpace: 'pre-line', fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' } }, message),
      el('div', { className: 'modal-actions', style: { marginTop: '20px', justifyContent: 'flex-end' } },
        el('button', {
          className: 'btn btn-primary',
          style: { minWidth: '80px' },
          onClick: () => {
            overlay.classList.remove('show');
            setTimeout(() => {
              overlay.remove();
              resolve(true);
            }, 200);
          }
        }, '확인')
      )
    );
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  });
}

/** 공통 푸터 HTML */
export function getFooterHTML() {
  return `
    <footer class="footer no-print">
      <div class="footer-in">
        <div class="f-brand">
          <img src="/logo-lotto.svg" alt="MINARI STUDIO 로고" style="width: 24px; height: 24px; object-fit: contain;">
          <div>
            <span class="f-wm">MINARI STUDIO</span>
            <span class="f-tag">Classroom Tools · Pair Lotto</span>
          </div>
        </div>
        <div class="f-legal">
          <span>© 2026 MINARI STUDIO. All rights reserved.</span>
        </div>
      </div>
    </footer>
  `;
}

/** 로딩 스피너 표시 */
export function showLoading(container) {
  const loader = el('div', { className: 'loading-spinner' },
    el('div', { className: 'spinner' }),
    el('p', {}, '로딩 중...')
  );
  container.innerHTML = '';
  container.appendChild(loader);
}

/** debounce */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

