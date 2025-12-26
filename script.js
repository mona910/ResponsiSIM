const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxhhcZzbMxFXCxFLYWTYpnIpZvq31rqFTerz_4wUywB-umS3s4Dha6c7w896WjpPZwx/exec";

// Harga semua court sama
const COURT_PRICE = 60000; // Rp 60.000 per jam

let currentCourt = '';
let currentDate = '';
let currentTime = '';

// Helper: return local date in YYYY-MM-DD for input[type=date] value
function getLocalISODate(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Load jadwal berdasarkan tanggal
async function loadSchedule(date = null) {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 2rem;">
            <style>
                @keyframes badmintonBounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(-15deg); }
                }
                @keyframes shuttlecock {
                    0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
                    50% { transform: translateX(40px) translateY(-30px) rotate(45deg); }
                }
                .badminton-loader {
                    display: inline-block;
                    font-size: 3rem;
                    animation: badmintonBounce 1.5s ease-in-out infinite;
                    margin-right: 1rem;
                }
                .shuttlecock-loader {
                    display: inline-block;
                    font-size: 2.5rem;
                    animation: shuttlecock 2s ease-in-out infinite;
                    margin-left: 1rem;
                    color: #ff6b35;
                }
                .loading-text {
                    margin-top: 1.5rem;
                    font-size: 1rem;
                    color: #666;
                    font-weight: 500;
                }
                .dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: #ff6b35;
                    border-radius: 50%;
                    animation: blink 1.4s infinite;
                    margin: 0 2px;
                }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes blink {
                    0%, 60%, 100% { opacity: 0.3; }
                    30% { opacity: 1; }
                }
            </style>
            <div>
                <div class="badminton-loader">🏸</div>
                <div class="shuttlecock-loader">🔺</div>
            </div>
            <div class="loading-text">
                Memuat jadwal
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        </div>
    `;

    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();

        // Jika date tidak diisi, gunakan hari ini (local)
        if (!date) {
            date = getLocalISODate();
            if (document.getElementById('filterDate')) {
                document.getElementById('filterDate').value = date;
            }
        }

        // Filter data berdasarkan tanggal
        const parseDate = (dateStr) => {
            // Try YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return new Date(dateStr + 'T00:00:00');
            }
            // Try DD/MM/YYYY or DD-MM-YYYY (assume DD/MM/YYYY for Indonesia)
            const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (match) {
                const [, day, month, year] = match;
                return new Date(year, month - 1, day);
            }
            // Fallback
            return new Date(dateStr);
        };

        const filteredData = data.filter(item => {
            const sheetDate = parseDate(item.Tanggal);
            const selectedDate = new Date(date + 'T00:00:00');

            sheetDate.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            return sheetDate.getTime() === selectedDate.getTime();
        });

        // Group by Court (hanya Court 1, 2, 3)
        const courts = {};
        filteredData.forEach(item => {
            if (!courts[item.Court]) {
                courts[item.Court] = [];
            }
            courts[item.Court].push({
                jam: item.Jam.padStart ? item.Jam.padStart(5, '0') : item.Jam, // normalize to HH:00
                status: item.Status,
                fromSheet: true
            });
        });

        // Generate HTML untuk 3 court
        let html = '';

        // Court 1, 2, 3 (tampilkan default jika tidak ada data)
        html += generateCourtCard('Court 1', courts['Court 1'] || [], date);
        html += generateCourtCard('Court 2', courts['Court 2'] || [], date);
        html += generateCourtCard('Court 3', courts['Court 3'] || [], date);

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading schedule:', error);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--primary);"></i>
                <h3 style="color: var(--secondary);">Gagal memuat jadwal</h3>
                <p>Silakan coba beberapa saat lagi</p>
                <button onclick="location.reload()" class="btn" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Refresh Halaman
                </button>
            </div>
        `;
    }
}

// Generate card untuk setiap court
function generateCourtCard(courtName, slots, date) {
    // Jika tidak ada slots, generate default jam 8:00-21:00
    if (!slots || slots.length === 0) {
    slots = [];
    for (let h = 8; h <= 21; h++) {
        slots.push({
            jam: `${h}:00`,
            status: 'Tersedia',
            fromSheet: false
        });
    }
}


    const now = new Date();

    // tanggal hari ini (00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // tanggal yang dipilih (00:00)
    const selectedDate = new Date(date + 'T00:00:00');

  const todayOnly = new Date();
todayOnly.setHours(0, 0, 0, 0);

const selectedDateOnly = new Date(date + 'T00:00:00');

slots = slots.map(slot => {

    const slotDateTime = new Date(`${date}T${slot.jam}:00`);

    // tanggal masa lalu
    if (selectedDateOnly < todayOnly) {
        slot.status = 'Lewat';
        return slot;
    }

    // hari ini → cek jam
    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
        slot.status = slotDateTime <= new Date() ? 'Lewat' : slot.status;
        return slot;
    }

    // tanggal masa depan → JANGAN UBAH STATUS DARI SPREADSHEET
    return slot;
});


    return `
        <div class="schedule-card">
            <div class="card-header">
                <i class="fas fa-table-tennis-paddle-ball"></i> 
                ${courtName}
            </div>
            <div class="card-body">
                <div style="text-align: center; margin-bottom: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 8px;">
                    <span style="color: var(--primary); font-weight: bold; font-size: 1.1rem;">
                        Rp 60.000/jam
                    </span>
                </div>

                <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                    ${slots.map(slot => `
                        <div class="time-slot ${slot.status === 'Lewat' ? 'past' : ''}">
                            <span class="slot-time">${slot.jam}</span>
                            <span class="slot-status ${slot.status === 'Tersedia' ? 'status-available' : slot.status === 'Booked' ? 'status-booked' : 'status-past'}">
                                ${slot.status}
                            </span>
                            ${slot.status === 'Tersedia'
                                ? `<button onclick="openBooking('${courtName}', '${date}', '${slot.jam}')" class="btn slot-btn">
                                        <i class="fas fa-book"></i> Book
                                   </button>`
                                : `<button class="btn disabled-btn slot-btn" disabled>
                                        <i class="fas fa-${slot.status === 'Booked' ? 'ban' : 'clock'}"></i> ${slot.status}
                                   </button>`
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}


// Format harga
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}

// Format tanggal Indonesia
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Open booking modal
function openBooking(court, tanggal, jam) {
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(tanggal + 'T00:00:00');
    const bookingDateTime = new Date(`${tanggal}T${jam}:00`);

    // tanggal masa lalu
    if (selectedDate < today) {
        alert('⚠️ Tidak bisa booking tanggal yang sudah lewat.');
        return;
    }

    // hari ini → cek jam
    if (selectedDate.getTime() === today.getTime()) {
        if (bookingDateTime <= now) {
            alert('⚠️ Tidak bisa booking jam yang sudah lewat.');
            return;
        }
    }

    // tanggal masa depan → LANGSUNG BOLEH
    currentCourt = court;
    currentDate = tanggal;
    currentTime = jam;

    document.getElementById('court').value = court;
    document.getElementById('tanggal').value = formatDate(tanggal);
    document.getElementById('jam').value = jam;
    document.getElementById('bookingModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
}

// Handle booking form submission
document.getElementById('bookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const bookingData = {
        nama: document.getElementById('nama').value,
        no_hp: document.getElementById('no_hp').value,
        court: currentCourt,
        tanggal: currentDate,
        jam: currentTime,
        harga: COURT_PRICE
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            alert(`✅ Booking Berhasil!\n\nCourt: ${currentCourt}\nTanggal: ${formatDate(currentDate)}\nJam: ${currentTime}\nHarga: Rp 60.000\n\nKami akan kirim konfirmasi via WhatsApp.`);
            closeModal();
            loadSchedule(currentDate);
            
            // Reset form
            this.reset();
        } else {
            alert('❌ Booking gagal. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('⚠️ Terjadi kesalahan. Silakan coba lagi.');
    }
});

// Filter jadwal berdasarkan tanggal
function filterSchedule() {
    const dateInput = document.getElementById('filterDate');
    if (dateInput.value) {
        loadSchedule(dateInput.value);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize dengan jam 8:00-21:00
document.addEventListener('DOMContentLoaded', function() {
    const today = getLocalISODate();
    const dateInput = document.getElementById('filterDate');
    if (dateInput) {
        // Set min date ke hari ini (local)
        dateInput.min = today;
        dateInput.value = today;

        // Set max date 30 hari dari sekarang
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        dateInput.max = getLocalISODate(maxDate);

        // Load initial schedule
        if (typeof loadSchedule === 'function') {
            loadSchedule(today);
        }
    }
});

// Function to toggle spec details
function toggleSpec(element) {
    const detail = element.querySelector('.spec-detail');
    if (detail.style.display === 'none' || detail.style.display === '') {
        element.classList.add('active');
        detail.style.display = 'block';
        detail.style.animation = 'fadeIn 0.5s ease-in-out';
    } else {
        element.classList.remove('active');
        detail.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            detail.style.display = 'none';
        }, 500);
    }
}

// Scroll animation observer
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
});

// Gallery carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const gallerySlides = document.querySelectorAll('.gallery-slide');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    const dotsContainer = document.querySelector('.gallery-dots');
    let currentIndex = 0;

    // Create dots
    gallerySlides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('gallery-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.gallery-dot');

    function showSlide(index) {
        const gallerySlidesContainer = document.querySelector('.gallery-slides');
        gallerySlidesContainer.style.transform = `translateX(-${index * 100}%)`;
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentIndex = index;
    }

    function nextSlide() {
        const nextIndex = (currentIndex + 1) % gallerySlides.length;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentIndex - 1 + gallerySlides.length) % gallerySlides.length;
        showSlide(prevIndex);
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
    }

    // Auto slide every 5 seconds
    setInterval(nextSlide, 5000);
});

// Set minimum date untuk input date (hari ini)
function setMinDate() {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.min = minDate;
        dateInput.value = minDate; // Set default ke hari ini
    }
}

// Initialize date picker saat halaman load
document.addEventListener('DOMContentLoaded', function() {
    setMinDate();
    
    // Set ulang min date setiap kali modal dibuka
    const modal = document.getElementById('bookingModal');
    if (modal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (modal.style.display === 'block') {
                        setMinDate();
                    }
                }
            });
        });
        observer.observe(modal, { attributes: true });
    }
});