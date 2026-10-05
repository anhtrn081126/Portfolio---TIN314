/**
 * CINEMA PORTFOLIO INTERACTIVE CONTROLLER
 * Script điều khiển hiệu ứng Mở Rèm, Đóng Rèm, Âm Thanh & Chuyển Cảnh Điện Ảnh
 */

// =============================================================================
// 1. WEB AUDIO API - HỆ THỐNG ÂM THANH ĐIỆN ẢNH (SYNTHESIZED CINEMA AUDIO)
// =============================================================================
class CinemaSoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Tiếng chuông rạp phim / Chime khởi động
    playCinemaChime() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Âm sắc điện ảnh: Nốt Đồ - Mi - Son ngân vang
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0.001, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 2.0);
        });
    }

    // Tiếng máy quay phim / Cuộn phim chạy (Projector click)
    playProjectorClick() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Tiếng đóng/mở rèm nhung (Whoosh effect)
    playCurtainWhoosh() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // White noise buffer
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(1200, now + 0.4);
        filter.frequency.linearRampToValueAtTime(200, now + 0.8);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.85);
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const cinemaSound = new CinemaSoundEngine();

// =============================================================================
// 2. KHỞI TẠO BIẾN GIAO DIỆN & SỰ KIỆN
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const curtainStage = document.getElementById('curtain-stage');
    const btnOpenCurtain = document.getElementById('btnOpenCurtain');
    const preShowContent = document.getElementById('pre-show-content');
    const cinemaCountdown = document.getElementById('cinemaCountdown');
    const countdownNum = document.getElementById('countdownNum');
    const theEndScreen = document.getElementById('theEndScreen');
    const btnTriggerCloseCurtain = document.getElementById('btnTriggerCloseCurtain');
    const btnCloseCurtainHeader = document.getElementById('btnCloseCurtainHeader');
    const btnReplayCurtain = document.getElementById('btnReplayCurtain');
    const btnOpenAgain = document.getElementById('btnOpenAgain');
    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');

    // Cập nhật giờ chiếu thực tế trên vé
    const ticketTime = document.getElementById('ticketTime');
    if (ticketTime) {
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        ticketTime.innerText = `${timeString} • LIVE`;
    }

    // -------------------------------------------------------------------------
    // HÀNH ĐỘNG 1: MỞ RÈM BẮT ĐẦU BUỔI CÔNG CHIẾU
    // -------------------------------------------------------------------------
    function openCinemaCurtains() {
        cinemaSound.init();
        cinemaSound.playCinemaChime();

        // Ẩn nội dung vé
        preShowContent.style.opacity = '0';
        preShowContent.style.pointerEvents = 'none';

        // Hiển thị đếm ngược 3 - 2 - 1
        cinemaCountdown.style.display = 'flex';
        let count = 3;
        countdownNum.innerText = count;
        cinemaSound.playProjectorClick();

        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNum.innerText = count;
                cinemaSound.playProjectorClick();
            } else {
                clearInterval(countInterval);
                cinemaCountdown.style.display = 'none';

                // KÉO RÈM SANG HAI BÊN
                cinemaSound.playCurtainWhoosh();
                curtainStage.classList.remove('closed');
                curtainStage.classList.add('open');

                // Kích hoạt Cảnh đầu tiên
                jumpToScene('scene-hero');
            }
        }, 600);
    }

    if (btnOpenCurtain) {
        btnOpenCurtain.addEventListener('click', openCinemaCurtains);
    }

    // -------------------------------------------------------------------------
    // HÀNH ĐỘNG 2: ĐÓNG RÈM BẾ MẠC & XEM CREDITS (THE END)
    // -------------------------------------------------------------------------
    function closeCinemaCurtains() {
        cinemaSound.playCurtainWhoosh();

        // Kéo rèm đóng lại
        curtainStage.classList.remove('open');
        curtainStage.classList.add('closed');

        // Ẩn vé cũ, mở màn hình The End
        preShowContent.style.display = 'none';
        theEndScreen.classList.add('show');

        // Sau 1s phát chuông kết thúc
        setTimeout(() => {
            cinemaSound.playCinemaChime();
        }, 800);
    }

    if (btnTriggerCloseCurtain) {
        btnTriggerCloseCurtain.addEventListener('click', closeCinemaCurtains);
    }
    if (btnCloseCurtainHeader) {
        btnCloseCurtainHeader.addEventListener('click', closeCinemaCurtains);
    }

    // -------------------------------------------------------------------------
    // HÀNH ĐỘNG 3: XEM LẠI TỪ ĐẦU (REPLAY) HOẶC MỞ LẠI NHANH
    // -------------------------------------------------------------------------
    if (btnReplayCurtain) {
        btnReplayCurtain.addEventListener('click', () => {
            theEndScreen.classList.remove('show');
            preShowContent.style.display = 'flex';
            preShowContent.style.opacity = '1';
            preShowContent.style.pointerEvents = 'all';
            jumpToScene('scene-hero');
        });
    }

    if (btnOpenAgain) {
        btnOpenAgain.addEventListener('click', () => {
            theEndScreen.classList.remove('show');
            cinemaSound.playCurtainWhoosh();
            curtainStage.classList.remove('closed');
            curtainStage.classList.add('open');
            jumpToScene('scene-hero');
        });
    }

    // -------------------------------------------------------------------------
    // ÂM THANH TOGGLE
    // -------------------------------------------------------------------------
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const isEnabled = cinemaSound.toggleSound();
            if (isEnabled) {
                soundToggle.innerHTML = '<i data-lucide="volume-2"></i>';
                soundToggle.title = 'Tắt âm thanh rạp phim';
            } else {
                soundToggle.innerHTML = '<i data-lucide="volume-x"></i>';
                soundToggle.title = 'Bật âm thanh rạp phim';
            }
            lucide.createIcons();
        });
    }

    // Khởi tạo các tính năng khác
    initNavigation();
    initGenreFilters();
    initDustCanvas();
    initContactForm();
});

// =============================================================================
// 3. ĐIỀU HƯỚNG CÁC HỒI / CẢNH PHIM (SCENE TRANSITIONS)
// =============================================================================
function jumpToScene(sceneId) {
    const scenes = document.querySelectorAll('.scene');
    const navItems = document.querySelectorAll('.nav-item');

    scenes.forEach(scene => {
        if (scene.id === sceneId) {
            scene.classList.add('active-scene');
            scene.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            scene.classList.remove('active-scene');
        }
    });

    navItems.forEach(item => {
        if (item.getAttribute('data-target') === sceneId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    cinemaSound.playProjectorClick();
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (target) jumpToScene(target);
        });
    });

    // Lắng nghe cuộn trang để cập nhật menu
    window.addEventListener('scroll', () => {
        const scenes = document.querySelectorAll('.scene');
        let currentScene = '';

        scenes.forEach(scene => {
            const rect = scene.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.2) {
                currentScene = scene.id;
            }
        });

        if (currentScene) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-target') === currentScene);
            });
        }
    });
}

// =============================================================================
// 4. BỘ LỌC DỰ ÁN THEO THỂ LOẠI (GENRE FILTER)
// =============================================================================
function initGenreFilters() {
    const genreBtns = document.querySelectorAll('.genre-btn');
    const posterCards = document.querySelectorAll('.movie-poster-card');

    genreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genreBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selectedGenre = btn.getAttribute('data-genre');
            cinemaSound.playProjectorClick();

            posterCards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                if (selectedGenre === 'all' || cardCat === selectedGenre) {
                    card.style.display = 'flex';
                    card.style.animation = 'modalPop 0.4s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// =============================================================================
// 5. MODAL POPUP CHI TIẾT TÁC PHẨM
// =============================================================================
const projectData = {
    'modal-p1': {
        title: '📊 Nền Tảng Phân Tích Dữ Liệu Kinh Doanh Real-time',
        genre: 'DATA SCIENCE • BUSINESS INTELLIGENCE',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        synopsis: 'Hệ thống dashboard đa chiều phục vụ ban quản trị doanh nghiệp theo dõi doanh số, hành vi người tiêu dùng và phân bổ dòng tiền trực tiếp qua biểu đồ tương tác cao.',
        details: [
            'Tự động làm sạch dữ liệu với thư viện Pandas và NumPy.',
            'Tích hợp thuật toán dự báo doanh thu chuỗi thời gian (Time-series Forecasting).',
            'Giao diện Streamlit tối ưu tốc độ render dưới 100ms cho 50,000+ bản ghi.'
        ],
        tech: ['Python', 'Streamlit', 'Pandas', 'Plotly', 'PostgreSQL'],
        github: 'https://github.com'
    },
    'modal-p2': {
        title: '🤖 Hệ Thống Định Giá Bất Động Sản Thông Minh',
        genre: 'MACHINE LEARNING • PREDICTIVE MODELING',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80',
        synopsis: 'Mô hình học máy ứng dụng các thuật toán hồi quy tiên tiến, đạt độ chính xác R2 Score 0.89 trên tập dữ liệu kiểm thử thực tế.',
        details: [
            'Khai phá dữ liệu (EDA), mã hóa biến phân loại và chuẩn hóa dữ liệu số.',
            'So sánh hiệu năng giữa Linear Regression, Random Forest và XGBoost Regressor.',
            'Xuất mô hình bằng Joblib và xây dựng API dự đoán trực tuyến.'
        ],
        tech: ['Scikit-Learn', 'Python', 'Seaborn', 'NumPy', 'Joblib'],
        github: 'https://github.com'
    },
    'modal-p3': {
        title: '🧮 Bộ Công Cụ Tính Toán Hình Học & Quản Lý Dữ Liệu',
        genre: 'PYTHON OOP • SYSTEM UTILITY',
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
        synopsis: 'Dự án trọng tâm môn học TIN 314, ứng dụng tư duy lập trình hàm, đóng gói lớp và giải thuật tối ưu tính toán hình học cùng quản lý học viên.',
        details: [
            'Hàm tính chu vi, diện tích đa giác với kiểm tra ràng buộc đầu vào.',
            'Quản lý dữ liệu học tập thông qua danh sách và từ điển có cấu trúc.',
            'Giao diện dòng lệnh thân thiện, thông báo lỗi tường minh.'
        ],
        tech: ['Python 3', 'OOP Structure', 'Modular Programming'],
        github: 'https://github.com'
    },
    'modal-p4': {
        title: '🎭 Trải Nghiệm Màn Chiếu Điện Ảnh Tương Tác',
        genre: 'INTERACTIVE WEB • SOUND SYNTHESIZER',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
        synopsis: 'Dự án thiết kế website sáng tạo kết hợp rèm nhung 3D, hiệu ứng đếm ngược công chiếu và công cụ tổng hợp âm thanh không cần file audio ngoài.',
        details: [
            'CSS 3D Transform kết hợp Bezier curves cho chuyển động rèm thực tế.',
            'Web Audio API tổng hợp âm thanh chuông rạp phim và cuộn máy quay.',
            'Tối ưu chuẩn Responsive và tương thích hoàn hảo font chữ tiếng Việt.'
        ],
        tech: ['HTML5/CSS3', 'Vanilla JavaScript', 'Web Audio API', 'Lucide'],
        github: 'https://github.com'
    }
};

function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    const modal = document.getElementById('cinemaModal');
    const content = document.getElementById('modalContent');

    const techTags = data.tech.map(t => `<span class="tech-tag">${t}</span>`).join(' ');
    const bulletList = data.details.map(d => `<li>${d}</li>`).join('');

    content.innerHTML = `
        <div style="margin-bottom:16px;">
            <span style="font-family:var(--font-cinema); font-size:0.75rem; color:var(--gold-primary); font-weight:700;">${data.genre}</span>
            <h2 style="font-family:var(--font-cinema); font-size:1.6rem; color:#ffffff; margin-top:4px;">${data.title}</h2>
        </div>
        <img src="${data.image}" style="width:100%; height:240px; object-fit:cover; border-radius:10px; margin-bottom:18px; border:1px solid rgba(245, 158, 11, 0.3);">
        <p style="color:#cbd5e1; font-size:0.95rem; line-height:1.6; margin-bottom:16px;">${data.synopsis}</p>
        <h4 style="color:#ffd700; font-size:0.95rem; margin-bottom:8px;">Điểm Nhấn Kỹ Thuật:</h4>
        <ul style="color:#94a3b8; font-size:0.9rem; margin-bottom:20px; padding-left:20px; line-height:1.6;">
            ${bulletList}
        </ul>
        <div style="margin-bottom:24px;">${techTags}</div>
        <div style="display:flex; gap:12px;">
            <a href="${data.github}" target="_blank" class="btn-cinema-gold" style="text-decoration:none;">
                <i data-lucide="github"></i> Xem Mã Nguồn Trên GitHub
            </a>
            <button onclick="closeModal()" class="btn-cinema-ghost">Đóng Cửa Sổ</button>
        </div>
    `;

    modal.classList.add('active');
    lucide.createIcons();
    cinemaSound.playProjectorClick();
}

function closeModal() {
    const modal = document.getElementById('cinemaModal');
    modal.classList.remove('active');
    cinemaSound.playProjectorClick();
}

// =============================================================================
// 6. HIỆU ỨNG HẠT BỤI PHÒNG CHIẾU (DUST PARTICLES EFFECT)
// =============================================================================
function initDustCanvas() {
    const container = document.getElementById('dust-particles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedY: Math.random() * 0.4 + 0.1,
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fde68a';

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y > canvas.height) p.y = 0;
            if (p.x > canvas.width) p.x = 0;
            if (p.x < 0) p.x = canvas.width;

            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// =============================================================================
// 7. FORM LIÊN HỆ ĐẠO DIỄN
// =============================================================================
function initContactForm() {
    const form = document.getElementById('cinemaContactForm');
    const feedback = document.getElementById('formFeedback');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('senderName').value;
            const email = document.getElementById('senderEmail').value;

            cinemaSound.playCinemaChime();

            feedback.className = 'form-feedback success';
            feedback.innerHTML = `🎉 <strong>Cảm ơn ${name}!</strong> Tin nhắn của bạn đã được chuyển tới Đạo diễn. Tôi sẽ liên hệ qua email <em>${email}</em> trong thời gian sớm nhất!`;
            feedback.style.display = 'block';

            form.reset();
        });
    }
}
