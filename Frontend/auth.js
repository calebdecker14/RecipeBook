// ===== Helper / Shared UI functions =====
function getEl(id) {
    return document.getElementById(id);
}

function setMessage(text, type = '') {
    const messageBox = getEl('message-box');
    if (!messageBox) return;
    messageBox.className = type;
    messageBox.innerText = text;
}

function showElement(id) {
    const el = getEl(id);
    if (el) el.classList.remove('hidden');
}

function hideElement(id) {
    const el = getEl(id);
    if (el) el.classList.add('hidden');
}

// ===== Auth helpers =====
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'Index.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'Index.html';
}

// Expose helper functions globally for inline handlers
window.requireAuth = requireAuth;
window.logout = logout;

// ===== Login / Signup Form Logic (only runs on the auth page) =====
if (getEl('login-form') && getEl('signup-form')) {
    const showSignup = getEl('show-signup');
    const showLogin = getEl('show-login');

    if (showSignup) {
        showSignup.onclick = (e) => {
            e.preventDefault();
            hideElement('login-container');
            showElement('signup-container');
            setMessage('');
        };
    }

    if (showLogin) {
        showLogin.onclick = (e) => {
            e.preventDefault();
            hideElement('signup-container');
            showElement('login-container');
            setMessage('');
        };
    }

    getEl('login-form').onsubmit = async (e) => {
        e.preventDefault();

        const username = getEl('login-username')?.value.trim() || '';
        const password = getEl('login-pass')?.value || '';

        try {
            const res = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const json = await res.json();

            if (res.ok) {
                localStorage.setItem('token', json.token);
                setMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                setMessage(json.error || json.message || 'Invalid credentials.', 'error');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setMessage('Server connection failed.', 'error');
        }
    };

    getEl('signup-form').onsubmit = async (e) => {
        e.preventDefault();

        const username = getEl('signup-user')?.value.trim() || '';
        const email = getEl('signup-email')?.value.trim() || '';
        const password = getEl('signup-pass')?.value || '';

        if (password.length < 6) {
            setMessage('Password must be at least 6 characters.', 'error');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await res.json();

            if (res.ok) {
                setMessage('Account created! You can now login.', 'success');
                setTimeout(() => {
                    showLogin?.click();
                }, 1500);
            } else {
                setMessage(result.error || result.message || 'Registration failed.', 'error');
            }
        } catch (err) {
            console.error('Signup Error:', err);
            setMessage('Server connection failed.', 'error');
        }
    };
}
