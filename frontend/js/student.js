document.addEventListener('DOMContentLoaded', async () => {
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name') || '';
  if (role !== 'student') {
    window.location.href = '/frontend/index.html';
    return;
  }
  document.getElementById('studentName').textContent = name;
  await loadGrades();
});

async function loadGrades() {
  const tbody = document.getElementById('gradesTableBody');
  tbody.innerHTML = '';
  try {
    const grades = await api('/api/grades/my-grades');
    for (const g of grades) {
      const tr = document.createElement('tr');
      const subjectName = g.Subject?.name || '';
      const className = g.Subject?.Class?.name || '';
      const assignment = g.assignment || '';
      const gradeVal = g.grade;
      const when = new Date(g.createdAt).toLocaleString();
      tr.innerHTML = `<td>${subjectName}</td><td>${className}</td><td>${assignment}</td><td>${gradeVal}</td><td>${when}</td>`;
      tbody.appendChild(tr);
    }
  } catch (e) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5">${e.message}</td>`;
    tbody.appendChild(tr);
  }
}
