async function updateProfile() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;

  await fetch('/profile/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username, email })
  });
}

async function changePassword() {
  const oldPassword = document.getElementById('old-pass').value;
  const newPassword = document.getElementById('new-pass').value;

  await fetch('/profile/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });
}

async function uploadPic() {
  const formData = new FormData();
  formData.append('image', document.getElementById('pic-input').files[0]);

  await fetch('/profile/profile-pic', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
}

document.getElementById('logout-btn').onclick = () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
};

document.getElementById('delete-btn').onclick = async () => {
  await fetch('/profile/delete', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  localStorage.removeItem('token');
  window.location.href = 'signup.html';
};

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";
