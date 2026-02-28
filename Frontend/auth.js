const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const messageBox = document.getElementById('message-box');

// switch between signup and login viewpoint
document.getElementById('show-signup').onclick = (e) => {
    e.preventDefault(); // Stop page jump
    loginContainer.classList.add('hidden');
    signupContainer.classList.remove('hidden');
    messageBox.innerText = "";
};

document.getElementById('show-login').onclick = (e) => {
    e.preventDefault();
    signupContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    messageBox.innerText = "";
};

// login logic with JWT handling
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    
    // Trim email to prevent accidental space errors
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-pass').value;

    try {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const json = await res.json();
    // if logins successful, direct to dashboard. if fail, show error
        if (res.ok) {
            localStorage.setItem('token', json.token);
            messageBox.className = "success";
            messageBox.innerText = "Login successful! Redirecting...";
            
            // Redirect after 1 second
            setTimeout(() => { 
                window.location.href = 'dashboard.html'; 
            }, 1000);
        } else {
            messageBox.className = "error";
            messageBox.innerText = json.error || json.message || "Invalid credentials.";
        }
    } catch (err) {
        console.error("Login Error:", err); // Human touch: logging the error
        messageBox.className = "error";
        messageBox.innerText = "Server connection failed.";
    }
};

// account creation
document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-user').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-pass').value;

    // Quick length check before hitting the server
    if (password.length < 6) {
        messageBox.className = "error";
        messageBox.innerText = "Password must be at least 6 characters.";
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
            messageBox.className = "success";
            messageBox.innerText = "Account created! You can now login.";
            
            // switch to login view
            setTimeout(() => {
                document.getElementById('show-login').click(); 
            }, 1500);
        } else {
            messageBox.className = "error";
            messageBox.innerText = result.error || result.message || "Registration failed.";
        }
    } catch (err) {
        console.error("Signup Error:", err);
        messageBox.className = "error";
        messageBox.innerText = "Server connection failed.";
    }
};