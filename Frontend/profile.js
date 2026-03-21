const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const API = "http://localhost:3000/profile";

// ----------------------
// Load User Info
// ----------------------
async function loadProfile() {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const user = await res.json();

  document.getElementById("username").value = user.username;
  document.getElementById("email").value = user.email;
  document.getElementById("bio").value = user.bio || "";

  if (user.profile_pic) {
    document.getElementById("profile-pic").src = user.profile_pic;
  }
}

loadProfile();

document.getElementById("back-btn").onclick = () => {
  window.location.href = "dashboard.html";
};

// ----------------------
// Update Profile Info
// ----------------------
async function updateProfile() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;

  await fetch(`${API}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username, email })
  });

  alert("Profile updated!");
}

// ----------------------
// Update Password
// ----------------------
async function changePassword() {
  const oldPassword = document.getElementById("old-pass").value;
  const newPassword = document.getElementById("new-pass").value;

  await fetch(`${API}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });

  alert("Password updated!");
}

// ----------------------
// Update Bio
// ----------------------
async function updateBio() {
  const bio = document.getElementById("bio").value;

  await fetch(`${API}/bio`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bio })
  });

  alert("Bio updated!");
}

// ----------------------
// Upload Profile Picture
// ----------------------
async function uploadPic() {
  const formData = new FormData();
  formData.append("image", document.getElementById("pic-input").files[0]);

  const res = await fetch(`${API}/profile-pic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  document.getElementById("profile-pic").src = data.profile_pic;

  alert("Profile picture updated!");
}

// ----------------------
// Logout
// ----------------------
document.getElementById("logout-btn").onclick = () => {
  localStorage.removeItem("token");
  window.location.href = "Index.html";
};

// ----------------------
// Delete Account
// ----------------------
document.getElementById("delete-btn").onclick = async () => {
  await fetch(`${API}/delete`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  localStorage.removeItem("token");
  window.location.href = "Index.html";
};
