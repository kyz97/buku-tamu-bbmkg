const KEY = "bbmkg_visitors_v1";

function loadVisitors() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function saveVisitors(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
function id() { return "T-" + Date.now().toString(36).toUpperCase(); }
function now() {
  return new Date().toLocaleString("id-ID", {
    day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
  }) + " WIB";
}
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function statusBadge(status) {
  const map = {
    pending:["wait","Menunggu"],
    approved:["ok","Disetujui"],
    rejected:["no","Ditolak"],
    exited:["ok","Sudah Keluar"]
  };
  const [cls,label] = map[status] || ["wait",status];
  return `<span class="badge ${cls}">${label}</span>`;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* =========================
   HALAMAN MASUK
========================= */
function setupEntry() {
  const form = document.getElementById("entryForm");
  if (!form) return;

  const namesContainer = document.getElementById("namesContainer");
  const addNameBtn = document.getElementById("addNameBtn");
  if (addNameBtn) {
    addNameBtn.addEventListener("click", () => {
      const row = document.createElement("div");
      row.className = "name-row";
      row.innerHTML = `<input class="guest-name-input" placeholder="Masukkan nama lengkap">
        <button type="button" class="btn-remove-name" onclick="this.parentElement.remove()">×</button>`;
      namesContainer.appendChild(row);
    });
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const names = Array.from(document.querySelectorAll(".guest-name-input"))
      .map(inp => inp.value.trim())
      .filter(Boolean);
    if (names.length === 0) return showToast("Isi minimal 1 nama tamu.");
    const visitor = {
      id:id(),
      names,
      unit:document.getElementById("unit").value.trim(),
      purpose:document.getElementById("purpose").value.trim(),
      status:"pending",
      entryAt:now(),
      exitAt:null
    };
    const visitors = loadVisitors();
    visitors.unshift(visitor);
    saveVisitors(visitors);
    localStorage.setItem("bbmkg_last_visitor_id", visitor.id);
    document.getElementById("visitorId").textContent = visitor.id;
    document.getElementById("entryForm").classList.add("hidden");
    document.getElementById("waiting").classList.remove("hidden");
  });
}

function copyVisitorId() {
  const idText = document.getElementById("visitorId").textContent;
  if (!idText) return;
  navigator.clipboard.writeText(idText).then(() => {
    showToast("Nomor kunjungan disalin.");
    const btn = document.getElementById("copyIdBtn");
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = "Tersalin ✓";
    btn.classList.add("copied");
    clearTimeout(copyVisitorId.timer);
    copyVisitorId.timer = setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1500);
  });
}

function checkEntryStatus() {
  const id = document.getElementById("visitorId").textContent;
  const visitor = loadVisitors().find(v => v.id === id);
  if (!visitor) return;
  if (visitor.status === "approved") {
    document.getElementById("waiting").classList.add("hidden");
    document.getElementById("approved").classList.remove("hidden");
  } else if (visitor.status === "rejected") {
    document.getElementById("waiting").classList.add("hidden");
    document.getElementById("rejected").classList.remove("hidden");
  } else {
    showToast("Masih menunggu konfirmasi petugas.");
  }
}

/* =========================
   HALAMAN KELUAR
========================= */
function setupExit() {
  const form = document.getElementById("exitForm");
  if (!form) return;

  const lastId = localStorage.getItem("bbmkg_last_visitor_id");
  const input = document.getElementById("visitorId");
  if (lastId && input) {
    input.value = lastId;
    showToast("Nomor kunjungan terakhir otomatis terisi.");
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const visitorId = document.getElementById("visitorId").value.trim().toUpperCase();
    const visitors = loadVisitors();
    const index = visitors.findIndex(v => v.id === visitorId);
    if (index === -1) return showToast("Nomor kunjungan tidak ditemukan.");
    if (visitors[index].status !== "approved")
      return showToast("Tamu belum memiliki akses masuk yang disetujui.");
    visitors[index].status = "exited";
    visitors[index].exitAt = now();
    saveVisitors(visitors);
    localStorage.removeItem("bbmkg_last_visitor_id");
    document.getElementById("exitForm").classList.add("hidden");
    document.getElementById("exitSuccess").classList.remove("hidden");
    document.getElementById("exitName").textContent = (visitors[index].names || []).join(", ");
    document.getElementById("exitTime").textContent = visitors[index].exitAt;
  });
}

/* =========================
   DASHBOARD PETUGAS
========================= */
function countUp(el, target) {
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || target === 0) { el.textContent = target; return; }
  const duration = 500;
  const start = performance.now();
  function tick(t) {
    const progress = Math.min((t - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderAdmin() {
  const app = document.getElementById("adminApp");
  if (!app) return;
  const visitors = loadVisitors();
  const pending = visitors.filter(v=>v.status==="pending").length;
  const inside = visitors.filter(v=>v.status==="approved").length;

  app.innerHTML = `
    <section class="dashboard">
      <div class="dashboard-top">
        <div>
          <div class="eyebrow">Panel Petugas</div>
          <h1 style="text-align:left">Tamu Menunggu Konfirmasi</h1>
          <p class="subtitle" style="margin-left:0;text-align:left">
            Periksa data pengunjung sebelum memberikan akses masuk.
          </p>
        </div>
        <button class="btn btn-danger btn-small" onclick="resetDemo()">Reset Demo</button>
      </div>

      <div class="stats">
        <div class="card stat"><span>Menunggu Konfirmasi</span><strong>${pending}</strong></div>
        <div class="card stat"><span>Sedang Di Dalam</span><strong>${inside}</strong></div>
        <div class="card stat"><span>Total Data</span><strong>${visitors.length}</strong></div>
      </div>

      ${visitors.length ? `<div class="visitor-list">
        ${visitors.map(v=>`<div class="card visitor-row">
          <div class="vinfo">
            <strong>${esc((v.names||[]).join(", "))}</strong>
            <small>${esc(v.unit)} • ${esc(v.purpose)}</small>
          </div>
          <div class="vtime">${esc(v.entryAt)}</div>
          <div class="vactions">
            ${v.status==="pending"
              ? `<button class="btn btn-danger btn-small" onclick="setStatus('${v.id}','rejected')">Tolak</button>
                 <button class="btn btn-primary btn-small" style="width:auto" onclick="setStatus('${v.id}','approved')">Konfirmasi</button>`
              : statusBadge(v.status)}
          </div>
        </div>`).join("")}
      </div>` : `<div class="card empty">Belum ada data kunjungan.</div>`}
    </section>`;

  countUp(app.querySelector(".stats .stat:nth-child(1) strong"), pending);
  countUp(app.querySelector(".stats .stat:nth-child(2) strong"), inside);
  countUp(app.querySelector(".stats .stat:nth-child(3) strong"), visitors.length);
}
function setStatus(visitorId,status) {
  const visitors=loadVisitors();
  const v=visitors.find(x=>x.id===visitorId);
  if(!v)return;
  v.status=status;
  saveVisitors(visitors);
  renderAdmin();
  showToast(status==="approved"?"Tamu dikonfirmasi.":"Tamu ditolak.");
}
function resetDemo() {
  if(confirm("Hapus seluruh data demo?")) {
    localStorage.removeItem(KEY);
    renderAdmin();
  }
}

setupEntry();
setupExit();
renderAdmin();