document.addEventListener('DOMContentLoaded', async () => {
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name') || '';
  if (role !== 'teacher') {
    window.location.href = '/frontend/index.html';
    return;
  }
  document.getElementById('teacherName').textContent = name;
  await Promise.all([
    refreshClasses(),
    loadAvailableStudents()
  ]);
});

async function refreshClasses() {
  // Fetch teacher's classes with included students/subjects
  const classes = await api('/api/classes');
  const classesTableBody = document.getElementById('classesTableBody');
  const classSelect = document.getElementById('classSelect');
  const subjectClass = document.getElementById('subjectClass');
  const gradeClass = document.getElementById('gradeClass');
  const gradeSubject = document.getElementById('gradeSubject');

  classesTableBody.innerHTML = '';
  classSelect.innerHTML = '';
  subjectClass.innerHTML = '';
  gradeClass.innerHTML = '';
  gradeSubject.innerHTML = '';

  for (const c of classes) {
    const tr = document.createElement('tr');
    const students = (c.students || []).map(s => s.name).join(', ');
    const subjects = (c.Subjects || c.subjects || []).map(su => su.name).join(', ');
    tr.innerHTML = `<td>${c.name}</td><td>${students}</td><td>${subjects}</td>`;
    classesTableBody.appendChild(tr);

    for (const sel of [classSelect, subjectClass, gradeClass]) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    }
  }

  // Populate subjects for first class in grade section
  await onGradeClassChange();
}

async function loadAvailableStudents() {
  const select = document.getElementById('availableStudents');
  select.innerHTML = '';
  try {
    const students = await api('/api/classes/available-students');
    for (const s of students) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.email})`;
      select.appendChild(opt);
    }
  } catch (e) {
    const opt = document.createElement('option');
    opt.textContent = e.message;
    select.appendChild(opt);
  }
}

async function createClass() {
  const name = document.getElementById('className').value.trim();
  const description = document.getElementById('classDesc').value.trim();
  if (!name) { alert('Class name is required'); return; }
  await api('/api/classes', { method: 'POST', body: JSON.stringify({ name, description }) });
  document.getElementById('className').value = '';
  document.getElementById('classDesc').value = '';
  await Promise.all([refreshClasses(), loadAvailableStudents()]);
}

async function addSelectedStudents() {
  const classId = document.getElementById('classSelect').value;
  if (!classId) { alert('Select a class'); return; }
  const select = document.getElementById('availableStudents');
  const ids = Array.from(select.selectedOptions).map(o => parseInt(o.value, 10));
  if (ids.length === 0) { alert('Select at least one student'); return; }
  await api(`/api/classes/${classId}/students`, { method: 'POST', body: JSON.stringify({ studentIds: ids }) });
  await Promise.all([refreshClasses(), loadAvailableStudents()]);
}

async function createSubject() {
  const classId = document.getElementById('subjectClass').value;
  const name = document.getElementById('subjectName').value.trim();
  const description = document.getElementById('subjectDesc').value.trim();
  if (!classId || !name) { alert('Select class and enter subject name'); return; }
  await api('/api/subjects', { method: 'POST', body: JSON.stringify({ classId, name, description }) });
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectDesc').value = '';
  await refreshClasses();
}

async function onGradeClassChange() {
  const classId = document.getElementById('gradeClass').value;
  const subjectSel = document.getElementById('gradeSubject');
  subjectSel.innerHTML = '';
  if (!classId) return;
  const subjects = await api(`/api/subjects/class/${classId}`);
  for (const s of subjects) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    subjectSel.appendChild(opt);
  }
  await loadStudentsForClass(parseInt(classId, 10));
}

async function loadStudentsForClass(classId) {
  const classes = await api('/api/classes');
  const c = classes.find(x => x.id === classId);
  const tbody = document.getElementById('gradeStudentsTable');
  tbody.innerHTML = '';
  if (!c) return;
  for (const s of (c.students || [])) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.email}</td><td><input type="number" min="0" max="100" step="0.01" data-student="${s.id}" placeholder="0-100"/></td>`;
    tbody.appendChild(tr);
  }
}

async function submitGrades() {
  const subjectId = document.getElementById('gradeSubject').value;
  const assignment = document.getElementById('gradeAssignment').value.trim();
  const inputs = document.querySelectorAll('#gradeStudentsTable input[type=number]');
  const grades = [];
  inputs.forEach(inp => {
    const v = inp.value;
    if (v !== '') grades.push({ studentId: parseInt(inp.dataset.student, 10), grade: parseFloat(v), assignment });
  });
  if (grades.length === 0) { alert('Enter at least one grade'); return; }
  await api('/api/grades', { method: 'POST', body: JSON.stringify({ subjectId, grades }) });
  alert('Grades submitted');
  inputs.forEach(inp => inp.value = '');
}
