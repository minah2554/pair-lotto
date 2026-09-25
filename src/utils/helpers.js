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
