// admin.js - Logic exclusively for the Principal dashboard

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('adminLoginForm');
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchFeedback');

    let allFeedbackData = [];

    // Check if user is already logged in securely
    const token = localStorage.getItem('adminToken');
    if (token) {
        showDashboard();
        fetchFeedbackData(token);
    }

    // 1. Admin Login Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const loginBtn = document.getElementById('loginBtn');
            const spinner = loginBtn.querySelector('.spinner');

            // UI Loading state
            loginBtn.disabled = true;
            spinner.classList.remove('hidden');
            loginBtn.querySelector('span').textContent = 'Verifying...';

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success
                    localStorage.setItem('adminToken', data.token);
                    showToast('Login successful!');
                    showDashboard();
                    fetchFeedbackData(data.token);
                } else {
                    // Failure
                    throw new Error(data.message || 'Invalid credentials');
                }
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                // Restore button
                loginBtn.disabled = false;
                spinner.classList.add('hidden');
                loginBtn.querySelector('span').textContent = 'Secure Login';
            }
        });
    }

    // 2. Fetch Feedback Data
    async function fetchFeedbackData(token) {

        const tableBody = document.getElementById('feedbackTableBody');
        const loadingState = document.getElementById('loadingData');
        const emptyState = document.getElementById('emptyData');

        tableBody.innerHTML = '';
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                // Token expired or invalid
                handleLogout();
                showToast('Session expired. Please log in again.', 'error');
                return;
            }

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch data');

            allFeedbackData = data;
            renderTable(allFeedbackData);

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loadingState.classList.add('hidden');
        }
    }

    // 3. Render Table Data
    function renderTable(data) {
        const tableBody = document.getElementById('feedbackTableBody');
        const emptyState = document.getElementById('emptyData');
        const tableContainer = document.querySelector('.table-responsive');

        // Update stats
        document.getElementById('totalCount').textContent = data.length;
        if (data.length > 0) {
            const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
            document.getElementById('avgRating').innerHTML = `${avg.toFixed(1)} <i class="fa-solid fa-star text-warning"></i>`;
        } else {
            document.getElementById('avgRating').innerHTML = `0.0 <i class="fa-solid fa-star text-warning"></i>`;
        }

        if (data.length === 0) {
            tableContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        tableContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tableBody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');

            // Format date
            const date = new Date(item.submitted_at).toLocaleDateString('en-GB', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Format stars
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                starsHtml += `<i class="fa-${i < item.rating ? 'solid' : 'regular'} fa-star text-warning" style="color:var(--warning)"></i>`;
            }

            // Format academic info
            let infoHtml = `<span class="badge" style="background:var(--accent-glow)">${item.department || '-'}</span>`;
            if (item.submitter_role === 'Student' && (item.class || item.section || item.year)) {
                infoHtml += `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                    ${item.year ? 'Year ' + item.year : ''} | 
                    ${item.class ? 'Class ' + item.class : ''} | 
                    ${item.section ? 'Sec ' + item.section : ''}
                </div>`;
            }

            row.innerHTML = `
                <td style="color:var(--text-muted); font-size:0.85rem;">${date}</td>
                <td style="font-weight:600;">${item.submitter_name}</td>
                <td style="font-weight:600;">${item.event_name}</td>
                <td>${infoHtml}</td>
                <td><span class="badge">${item.submitter_role}</span></td>
                <td>${starsHtml}</td>
                <td style="max-width:300px; color:var(--text-muted);">${item.comments || '<span style="opacity:0.3">No comments provided.</span>'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 4. Search Functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredData = allFeedbackData.filter(item =>
                item.event_name.toLowerCase().includes(term) ||
                item.submitter_name.toLowerCase().includes(term) ||
                item.submitter_role.toLowerCase().includes(term)
            );
            renderTable(filteredData);
        });
    }

    // 5. Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    function handleLogout() {
        localStorage.removeItem('adminToken');
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        document.getElementById('adminLoginForm').reset();
    }

    function showDashboard() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
    }
});
