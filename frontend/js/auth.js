document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const err = document.getElementById('loginError');
      err.textContent = '';
      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setAuth(data);
        if (data.role === 'teacher') window.location.href = '/frontend/teacher.html';
        else window.location.href = '/frontend/student.html';
      } catch (e) {
        err.textContent = e.message;
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const role = document.getElementById('role').value;
      const err = document.getElementById('registerError');
      err.textContent = '';
      try {
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role })
        });
        setAuth(data);
        if (data.role === 'teacher') window.location.href = '/frontend/teacher.html';
        else window.location.href = '/frontend/student.html';
      } catch (e) {
        err.textContent = e.message;
      }
    });
  }
});
