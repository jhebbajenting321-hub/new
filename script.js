document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hazard-form");
    const reportsContainer = document.getElementById("reports-container");
    
    const statTotal = document.getElementById("stat-total");
    const statPending = document.getElementById("stat-pending");
    const statResolved = document.getElementById("stat-resolved");

    // Load initial reports from LocalStorage or initialize with empty array
    let reports = JSON.parse(localStorage.getItem("cityalert_reports")) || [];

    // Render reports and update stats on page load
    renderReports();
    updateDashboard();

    // Handle form submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const category = document.getElementById("category").value;
        const location = document.getElementById("location").value.trim();
        const description = document.getElementById("description").value.trim();

        if (!name || !category || !location || !description) return;

        const newReport = {
            id: Date.now(),
            name,
            category,
            location,
            description,
            status: "Pending",
            date: new Date().toLocaleDateString()
        };

        reports.unshift(newReport);
        saveAndRefresh();
        form.reset();
    });

    // Toggle status between Pending and Resolved
    window.toggleStatus = (id) => {
        reports = reports.map(report => {
            if (report.id === id) {
                report.status = report.status === "Pending" ? "Resolved" : "Pending";
            }
            return report;
        });
        saveAndRefresh();
    };

    function saveAndRefresh() {
        localStorage.setItem("cityalert_reports", JSON.stringify(reports));
        renderReports();
        updateDashboard();
    }

    function updateDashboard() {
        const total = reports.length;
        const pending = reports.filter(r => r.status === "Pending").length;
        const resolved = reports.filter(r => r.status === "Resolved").length;

        statTotal.textContent = total;
        statPending.textContent = pending;
        statResolved.textContent = resolved;
    }

    function renderReports() {
        reportsContainer.innerHTML = "";

        if (reports.length === 0) {
            reportsContainer.innerHTML = `<p class="empty-msg">No reports submitted yet.</p>`;
            return;
        }

        reports.forEach(report => {
            const reportEl = document.createElement("div");
            reportEl.className = "report-item";

            const isPending = report.status === "Pending";
            const statusClass = isPending ? "pending" : "resolved";

            reportEl.innerHTML = `
                <div class="report-info">
                    <h4>${escapeHtml(report.category)} - ${escapeHtml(report.location)}</h4>
                    <div class="meta">
                        Reported by <strong>${escapeHtml(report.name)}</strong> on ${report.date} | 
                        <span class="status-tag ${statusClass}">${report.status}</span>
                    </div>
                    <p>${escapeHtml(report.description)}</p>
                </div>
                <div>
                    <button class="btn-resolve" onclick="toggleStatus(${report.id})">
                        Mark as ${isPending ? "Resolved" : "Pending"}
                    </button>
                </div>
            `;

            reportsContainer.appendChild(reportEl);
        });
    }

    // Helper to prevent XSS injection
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (match) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return map[match];
        });
    }
});