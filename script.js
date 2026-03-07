const API_URL = 'http://localhost:5000/api';
let currentRating = 0;

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ---------------------------
// Feedback Form Logic (index.html)
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('feedbackForm');
    if (form) {

        // 1. Role Selector Logic
        const roleOptions = document.querySelectorAll('.role-option');
        const studentFields = document.getElementById('studentFields');
        const staffFields = document.getElementById('staffFields');

        roleOptions.forEach(option => {
            option.addEventListener('click', () => {
                roleOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;

                // Toggle Field Groups
                if (radio.value === 'Student') {
                    studentFields.classList.remove('hidden');
                    staffFields.classList.add('hidden');
                } else {
                    studentFields.classList.add('hidden');
                    staffFields.classList.remove('hidden');
                }
                updateProgress(); // Update progress when fields change
            });
        });

        // Initialize on load
        const checkedRole = document.querySelector('input[name="role"]:checked');
        if (checkedRole) {
            if (checkedRole.value === 'Student') {
                studentFields.classList.remove('hidden');
            } else {
                staffFields.classList.remove('hidden');
            }
        }

        // --- Premium UX Logic ---

        // 1. Character Counter
        const commentsArea = document.getElementById('comments');
        const charCount = document.getElementById('charCount');
        if (commentsArea && charCount) {
            commentsArea.addEventListener('input', () => {
                charCount.textContent = commentsArea.value.length;
            });
        }

        // 2. Progress Bar
        const updateProgress = () => {
            const role = document.querySelector('input[name="role"]:checked').value;
            const commonInputs = [
                document.getElementById('submitterName'),
                document.getElementById('eventName'),
                { value: currentRating > 0 ? 'rated' : '' }
            ];

            let specificInputs = [];
            if (role === 'Student') {
                specificInputs = [
                    document.getElementById('studentDept'),
                    document.getElementById('class_name'),
                    document.getElementById('section'),
                    document.getElementById('year')
                ];
            } else {
                specificInputs = [document.getElementById('staffDept')];
            }

            const allInputs = [...commonInputs, ...specificInputs];
            let completed = 0;
            allInputs.forEach(input => {
                if (input && input.value && input.value.length > 0) completed++;
            });

            const progress = (completed / allInputs.length) * 100;
            const pb = document.getElementById('formProgress');
            if (pb) pb.style.width = `${progress}%`;
        };

        // Add listeners for progress
        ['submitterName', 'eventName', 'studentDept', 'staffDept', 'class_name', 'section', 'year'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateProgress);
                el.addEventListener('change', updateProgress);
            }
        });

        // 3. Simple Confetti System
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        let particles = [];

        function createConfetti() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 150; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height - canvas.height,
                    size: Math.random() * 8 + 4,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    velocity: { x: (Math.random() - 0.5) * 5, y: Math.random() * 5 + 5 },
                    rotation: Math.random() * 360,
                    rotationSpeed: Math.random() * 10 - 5
                });
            }
            animateConfetti();
        }

        function animateConfetti() {
            if (!ctx || particles.length === 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.y += p.velocity.y;
                p.x += p.velocity.x;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.y > canvas.height) particles.splice(i, 1);
            });
            if (particles.length > 0) requestAnimationFrame(animateConfetti);
        }

        // 4. Validation Glow Update
        const applyGlow = (el, isValid) => {
            if (!el) return;
            if (isValid) {
                el.classList.add('valid-input');
                el.classList.remove('invalid-input');
            } else {
                el.classList.remove('valid-input');
                el.classList.add('invalid-input');
            }
        };

        // Attach glow listeners
        ['submitterName', 'eventName', 'studentDept', 'staffDept', 'class_name', 'section', 'year'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('blur', () => {
                    applyGlow(el, el.value.length > 0);
                });
            }
        });

        // 2. Star Rating Logic
        const stars = document.querySelectorAll('#starRating i');
        const ratingInput = document.getElementById('ratingValue');
        // let currentRating = 0; // Already declared above

        stars.forEach(star => {
            star.addEventListener('mouseover', function () {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(value, 'fas'); // highlight filled
            });

            star.addEventListener('mouseout', function () {
                highlightStars(currentRating, 'fas'); // reset to selected
            });

            star.addEventListener('click', function () {
                currentRating = parseInt(this.getAttribute('data-value'));
                ratingInput.value = currentRating;
                highlightStars(currentRating, 'fas');
                updateProgress(); // Update progress on rating

                // Add a little pop animation class temporarily
                this.classList.add('pop');
                setTimeout(() => this.classList.remove('pop'), 200);
            });
        });

        function highlightStars(count, styleClass) {
            stars.forEach((s, index) => {
                s.className = 'fa-star ' + (index < count ? 'fa-solid active' : 'fa-regular');
            });
        }

        // 3. Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            const currentRole = formData.get('role');
            let finalDept = '';
            let classVal = '';
            let sectionVal = '';
            let yearVal = '';

            if (currentRole === 'Student') {
                finalDept = formData.get('studentDept');
                classVal = formData.get('class_name');
                sectionVal = formData.get('section');
                yearVal = formData.get('year');

                if (!finalDept || !classVal || !sectionVal || !yearVal) {
                    showToast('All student details are required.', 'error');
                    return;
                }
            } else {
                finalDept = formData.get('staffDept');
                if (!finalDept) {
                    showToast('Please select your department.', 'error');
                    return;
                }
            }

            if (currentRating === 0) {
                showToast('Please select a rating before submitting.', 'error');
                return;
            }

            const payload = {
                submitter_name: formData.get('submitterName'),
                event_name: formData.get('eventName'),
                submitter_role: currentRole,
                department: finalDept,
                class_name: classVal,
                section: sectionVal,
                year: yearVal,
                rating: currentRating,
                comments: formData.get('comments')
            };

            const submitBtn = document.getElementById('submitBtn');
            const spinner = submitBtn.querySelector('.spinner');
            const btnText = submitBtn.querySelector('span');
            const btnIcon = submitBtn.querySelector('i:not(.spinner)');

            // Loading state
            submitBtn.disabled = true;
            spinner.classList.remove('hidden');
            btnText.textContent = 'Submitting...';
            if (btnIcon) btnIcon.classList.add('hidden');

            try {
                const response = await fetch(`${API_URL}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    form.classList.add('hidden');
                    document.getElementById('successMessage').classList.remove('hidden');
                    showToast('Feedback submitted successfully!');
                    createConfetti(); // CELEBRATE!
                } else {
                    throw new Error(data.message || 'Failed to submit feedback');
                }

            } catch (error) {
                showToast(error.message, 'error');
                // Restore button
                submitBtn.disabled = false;
                spinner.classList.add('hidden');
                btnText.textContent = 'Submit Feedback';
                if (btnIcon) btnIcon.classList.remove('hidden');
            }
        });
    }
});

// Function specifically for index.html to reset UI
function resetForm() {
    const form = document.getElementById('feedbackForm');
    const successMsg = document.getElementById('successMessage');

    // Reset inputs
    document.getElementById('submitterName').value = '';
    document.getElementById('studentDept').selectedIndex = 0;
    document.getElementById('staffDept').selectedIndex = 0;
    document.getElementById('class_name').selectedIndex = 0;
    document.getElementById('section').selectedIndex = 0;
    document.getElementById('year').selectedIndex = 0;
    document.getElementById('eventName').value = '';
    document.getElementById('comments').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('formProgress').style.width = '0%';

    // Clear glows
    ['submitterName', 'eventName', 'studentDept', 'staffDept', 'class_name', 'section', 'year'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('valid-input');
            el.classList.remove('invalid-input');
        }
    });

    // Reset stars
    document.getElementById('ratingValue').value = '';
    document.querySelectorAll('#starRating i').forEach(s => s.className = 'fa-regular fa-star');
    currentRating = 0;

    // Reset button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.querySelector('.spinner').classList.add('hidden');
    submitBtn.querySelector('span').textContent = 'Submit Feedback';
    const icon = submitBtn.querySelector('i.fa-paper-plane');
    if (icon) icon.classList.remove('hidden');

    successMsg.classList.add('hidden');
    form.classList.remove('hidden');

    // Animate form in
    form.style.animation = 'none';
    form.offsetHeight; /* trigger reflow */
    form.style.animation = null;
}
