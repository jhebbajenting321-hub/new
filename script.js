// ==========================================
// FIREBASE CONFIGURATION (Project: city-alert-123)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB-mquyQjD862qE20iK078xk0-5iLv40wA",
  authDomain: "city-alert-123.firebaseapp.com",
  databaseURL: "https://city-alert-123-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "city-alert-123",
  storageBucket: "city-alert-123.firebasestorage.app",
  messagingSenderId: "88853751811",
  appId: "1:88853751811:web:96a3282dcf2e7a5eb0636",
  measurementId: "G-N7BG5BWQGZ"
};

// Initialize Firebase
let db = null;
let reportsRef = null;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    reportsRef = db.ref('reports');
  }
} catch (e) {
  console.warn("Firebase warning:", e);
}

// System State
let isAdminLoggedIn = false;
let notifications = [];
let reportsMap = {};
let initialLoadComplete = false;
let uploadedBase64Photo = "";

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  if (reportsRef) {
    reportsRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      
      if (initialLoadComplete && isAdminLoggedIn) {
        Object.keys(data).forEach(key => {
          if (!reportsMap[key]) {
            const newRep = data[key];
            const newNotif = {
              id: Date.now(),
              message: `Bagong ulat sa ${newRep.location}: ${newRep.category}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false
            };
            notifications.unshift(newNotif);
            renderNotifications();
          }
        });
      }

      reportsMap = data;
      initialLoadComplete = true;

      updateStats();
      renderUserSubmissions();
      if (isAdminLoggedIn) renderAdminTable();
    });
  } else {
    updateStats();
    renderUserSubmissions();
  }
});

// 1. GPS GEOLOCATION FEATURE
function getCurrentLocation() {
  const status = document.getElementById('gps-status');
  const locationInput = document.getElementById('hazard-location');

  if (!navigator.geolocation) {
    status.innerText = "Hindi suportado ng iyong browser ang GPS.";
    status.classList.add("text-red-500");
    return;
  }

  status.innerText = "Kinukuha ang iyong GPS location...";
  status.classList.remove("text-red-500");
  status.classList.add("text-blue-600");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);
      locationInput.value = `GPS: Lat ${lat}, Lng ${lng} (GenSan)`;
      status.innerText = "Nakuha na ang GPS coordinates!";
      status.classList.remove("text-blue-600");
      status.classList.add("text-emerald-600");
    },
    (error) => {
      status.innerText = "Mali sa pagkuha ng GPS. Mangyaring i-type na lamang ang lokasyon.";
      status.classList.remove("text-blue-600");
      status.classList.add("text-red-500");
    }
  );
}

// 2. PHOTO PREVIEW & CONVERSION (Base64)
function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('image-preview');
  const container = document.getElementById('image-preview-container');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      container.classList.remove('hidden');
      uploadedBase64Photo = e.target.result; // Save base64 data
    };
    reader.readAsDataURL(file);
  } else {
    container.classList.add('hidden');
    uploadedBase64Photo = "";
  }
}

// FORM SUBMISSION
function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Ipinapadala...';

  const name = document.getElementById('reporter-name').value;
  const category = document.getElementById('hazard-category').value;
  const location = document.getElementById('hazard-location').value;
  const desc = document.getElementById('hazard-desc').value;

  const newReport = {
    name,
    category,
    location,
    desc,
    photo: uploadedBase64Photo || "",
    status: 'Pending',
    date: new Date().toLocaleDateString(),
    timestamp: Date.now()
  };

  if (reportsRef) {
    reportsRef.push(newReport).then(() => {
      document.getElementById('hazard-form').reset();
      document.getElementById('image-preview-container').classList.add('hidden');
      document.getElementById('gps-status').innerText = "";
      uploadedBase64Photo = "";
      submitBtn.disabled = false;
      submitBtn.innerText = 'Ipadala ang Ulat';
      alert('Maraming salamat! Naisumite na ang iyong ulat sa LGU General Santos City.');
    }).catch(err => {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Ipadala ang Ulat';
      alert('Nagkaroon ng problema: ' + err.message);
    });
  } else {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Ipadala ang Ulat';
    alert('Hindi nakakonekta sa database.');
  }
}

// MODAL CONTROLS & AUTH
function openLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
  document.getElementById('login-modal').classList.add('flex');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('flex');
  document.getElementById('login-error').classList.add('hidden');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById('admin-user').value;
  const pass = document.getElementById('admin-pass').value;

  if (user === 'admin' && pass === 'admin123') {
    isAdminLoggedIn = true;
    closeLoginModal();
    toggleViewMode();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function toggleViewMode() {
  const publicNav = document.getElementById('public-nav');
  const adminNav = document.getElementById('admin-nav');
  const publicView = document.getElementById('public-view-container');
  const adminView = document.getElementById('admin-view-container');

  if (isAdminLoggedIn) {
    publicNav.classList.add('hidden');
    publicView.classList.add('hidden');
    adminNav.classList.remove('hidden');
    adminNav.classList.add('flex');
    adminView.classList.remove('hidden');
    renderAdminTable();
    updateStats();
  } else {
    publicNav.classList.remove('hidden');
    publicView.classList.remove('hidden');
    adminNav.classList.add('hidden');
    adminNav.classList.remove('flex');
    adminView.classList.add('hidden');
    document.getElementById('notif-dropdown').classList.add('hidden');
    renderUserSubmissions();
    updateStats();
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  toggleViewMode();
}

function getReportsArray() {
  return Object.keys(reportsMap).map(key => ({
    key,
    ...reportsMap[key]
  })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function updateStats() {
  const reportsList = getReportsArray();
  const total = reportsList.length;
  const pending = reportsList.filter(r => r.status === 'Pending').length;
  const resolved = reportsList.filter(r => r.status === 'Resolved').length;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-pending').innerText = pending;
  document.getElementById('stat-resolved').innerText = resolved;

  const adminTotal = document.getElementById('admin-stat-total');
  if (adminTotal) {
    adminTotal.innerText = total;
    document.getElementById('admin-stat-pending').innerText = pending;
    document.getElementById('admin-stat-resolved').innerText = resolved;
  }
}

// RENDER PUBLIC TABLE
function renderUserSubmissions() {
  const tbody = document.getElementById('user-table-body');
  const countBadge = document.getElementById('user-report-count');
  const reportsList = getReportsArray();

  if (!tbody) return;

  countBadge.innerText = `${reportsList.length} Aktibong Ulat`;

  if (reportsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Walang naitalang ulat sa General Santos City sa kasalukuyan.</td></tr>`;
    return;
  }

  tbody.innerHTML = reportsList.map(r => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="p-3">
        ${r.photo ? `<img src="${r.photo}" class="w-12 h-12 object-cover rounded-md border border-slate-200">` : `<span class="text-slate-400 italic text-[10px]">Walang larawan</span>`}
      </td>
      <td class="p-3 font-semibold text-slate-800">${r.category}</td>
      <td class="p-3 font-medium text-blue-700">${r.location}</td>
      <td class="p-3 text-slate-500 max-w-xs truncate">${r.desc}</td>
      <td class="p-3 text-slate-400">${r.date || 'Ngayon'}</td>
      <td class="p-3 text-right">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
        }">
          <span class="w-1.5 h-1.5 rounded-full ${r.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          ${r.status === 'Resolved' ? 'Naresolba Na' : 'Inaaksyunan'}
        </span>
      </td>
    </tr>
  `).join('');
}

// RENDER ADMIN TABLE
function renderAdminTable() {
  const tbody = document.getElementById('admin-table-body');
  const reportsList = getReportsArray();

  if (!tbody) return;

  if (reportsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-500">Walang ulat sa cloud database.</td></tr>`;
    return;
  }

  tbody.innerHTML = reportsList.map(r => `
    <tr class="hover:bg-slate-800/50 transition">
      <td class="p-3">
        ${r.photo ? `<img src="${r.photo}" class="w-12 h-12 object-cover rounded-md border border-slate-700">` : `<span class="text-slate-500 italic text-[10px]">Walang larawan</span>`}
      </td>
      <td class="p-3 font-semibold text-white">${r.name}</td>
      <td class="p-3 text-slate-300">${r.category}</td>
      <td class="p-3 text-blue-400 font-medium">${r.location}</td>
      <td class="p-3 text-slate-400 max-w-xs truncate">${r.desc}</td>
      <td class="p-3 text-slate-400">${r.date || 'Ngayon'}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 text-[10px] rounded-full font-semibold ${
          r.status === 'Resolved' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-amber-900/60 text-amber-300 border border-amber-700'
        }">
          ${r.status === 'Resolved' ? 'Naresolba Na' : 'Pending'}
        </span>
      </td>
      <td class="p-3 text-right space-x-1.5">
        ${r.status === 'Pending' ? `
          <button onclick="resolveReport('${r.key}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-semibold transition">
            Resolbahin
          </button>
        ` : ''}
        <button onclick="deleteReport('${r.key}')" class="bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1 rounded text-[10px] font-semibold transition">
          Burahin
        </button>
      </td>
    </tr>
  `).join('');
}

function resolveReport(key) {
  if (reportsRef && key) {
    reportsRef.child(key).update({ status: 'Resolved' });
  }
}

function deleteReport(key) {
  if (reportsRef && key) {
    reportsRef.child(key).remove();
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
      notifications.forEach(n => n.read = true);
      renderNotifications();
    }
  }
}

function renderNotifications() {
  const badge = document.getElementById('notif-badge');
  const list = document.getElementById('notif-list');
  const unreadCount = notifications.filter(n => !n.read).length;

  if (badge) {
    if (unreadCount > 0) {
      badge.innerText = unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (list) {
    if (notifications.length === 0) {
      list.innerHTML = `<p class="p-4 text-xs text-slate-400 text-center">Walang bagong abiso</p>`;
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="p-3 text-xs hover:bg-slate-50 transition ${!n.read ? 'bg-blue-50/60' : ''}">
        <p class="font-semibold text-slate-800 mb-1">${n.message}</p>
        <span class="text-[10px] text-slate-400">${n.time}</span>
      </div>
    `).join('');
  }
}

function clearNotifications() {
  notifications = [];
  renderNotifications();
}