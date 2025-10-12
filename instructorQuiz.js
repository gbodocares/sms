// ✅ Instructor Mapping (Manual Login)
const instructorsx = {
  daprince: "Tailoring",
  enywealth: "Make-up",
  chioma: "Nails Decoration",
  fera: "Video Editing",
  taiwo: "Videography",
  ezekiel: "Web Design",
  deji: "UI/UX Design",
  sylvester: "Computer Networking"
};

let currentInstructor = null;
let editQuizId = null;

const loginBtn = document.getElementById('loginBtn');
const loginUsername = document.getElementById('loginUsername');
const loginSection = document.getElementById('loginSection');
const quizSection = document.getElementById('quizSection');
const quizDept = document.getElementById('quizDept');
const quizForm = document.getElementById('quizForm');
const quizList = document.getElementById('quizList');
const previewBox = document.getElementById('previewBox');
const questionsContainer = document.getElementById('questionsContainer');

// ✅ Manual Instructor Login
loginBtn.onclick = () => {
  const username = loginUsername.value.trim().toLowerCase();
  if (instructorsx[username]) {
    currentInstructor = username;
    quizDept.value = instructorsx[username];
    loginSection.style.display = "none";
    quizSection.style.display = "block";
    loadQuizzes();
  } else {
    alert("❌ Invalid username!");
  }
};

// ✅ Add Question Field
document.getElementById('addQuestionBtn').onclick = () => addQuestionField();

function addQuestionField(data = {}) {
  const div = document.createElement('div');
  div.className = 'question-item';
  div.innerHTML = `
    <label>Question:</label>
    <input type="text" class="qText" value="${data.q || ''}" placeholder="Enter question" required>
    <label>Options (comma separated):</label>
    <input type="text" class="qOptions" value="${data.options ? data.options.join(', ') : ''}" placeholder="e.g. A,B,C,D" required>
    <label>Correct Answer:</label>
    <input type="text" class="qAnswer" value="${data.answer || ''}" placeholder="Enter correct answer" required>
    <button type="button" class="btn-danger" onclick="this.parentElement.remove()">Remove</button>
    <hr>
  `;
  questionsContainer.appendChild(div);
}

// ✅ Collect Questions
function collectQuestions() {
  const questions = [];
  document.querySelectorAll('.question-item').forEach(div => {
    const q = div.querySelector('.qText').value.trim();
    const options = div.querySelector('.qOptions').value.split(',').map(o=>o.trim());
    const answer = div.querySelector('.qAnswer').value.trim();
    if (q && options.length && answer) questions.push({ q, options, answer });
  });
  return questions;
}

// ✅ Preview Quiz
document.getElementById('previewBtn').onclick = () => {
  const title = quizForm.quizTitle.value;
  const duration = quizForm.quizDuration.value;
  const marks = quizForm.quizMarks.value;
  const startAt = quizForm.startAt.value;
  const endAt = quizForm.endAt.value;
  const questions = collectQuestions();
  if (!questions.length) return alert("Add at least one question!");

  previewBox.innerHTML = `
    <h4>📘 Preview: ${title}</h4>
    <p><strong>Duration:</strong> ${duration} mins | <strong>Total Marks:</strong> ${marks}</p>
    <p><strong>Department:</strong> ${quizDept.value}</p>
    <p><strong>Available From:</strong> ${startAt || 'N/A'} <br> <strong>To:</strong> ${endAt || 'N/A'}</p>
    <hr>
    ${questions.map((q,i)=>`
      <div><strong>${i+1}. ${q.q}</strong><br>
      Options: ${q.options.join(', ')}<br>
      Answer: <em>${q.answer}</em></div><br>`).join('')}
  `;
  previewBox.style.display = 'block';
};

// ✅ Save or Update Quiz
quizForm.onsubmit = async (e) => {
  e.preventDefault();
  const quizData = {
    title: quizForm.quizTitle.value,
    duration: parseInt(quizForm.quizDuration.value),
    department: quizDept.value,
    marks: parseInt(quizForm.quizMarks.value),
    startAt: quizForm.startAt.value ? new Date(quizForm.startAt.value) : null,
    endAt: quizForm.endAt.value ? new Date(quizForm.endAt.value) : null,
    questions: collectQuestions(),
    createdAt: new Date(),
  };
  if (!quizData.questions.length) return alert("Add at least one question!");

  if (editQuizId) {
    await db.collection('quizzes').doc(editQuizId).update(quizData);
    alert("✅ Quiz updated!");
    editQuizId = null;
    quizForm.querySelector('button[type="submit"]').textContent = "Save Quiz";
  } else {
    await db.collection('quizzes').add({ ...quizData, active:false });
    alert("✅ Quiz created!");
  }

  quizForm.reset();
  questionsContainer.innerHTML = '';
  previewBox.style.display = 'none';
  loadQuizzes();
};

// ✅ Load Instructor’s Quizzes
async function loadQuizzes() {
  quizList.innerHTML = '';
  const snapshot = await db.collection('quizzes')
    .where('department', '==', instructorsx[currentInstructor])
    .orderBy('createdAt', 'desc')
    .get();
  snapshot.forEach(doc => {
    const quiz = doc.data();
    const div = document.createElement('div');
    div.className = 'quiz-item';
    div.innerHTML = `
      <strong>${quiz.title}</strong><br>
      Duration: ${quiz.duration} mins | Marks: ${quiz.marks}<br>
      Active: ${quiz.active ? '✅' : '❌'}<br>
      <button class="btn-green" onclick="toggleQuiz('${doc.id}', ${!quiz.active})">
        ${quiz.active ? 'Deactivate' : 'Activate'}
      </button>
      <button onclick="editQuiz('${doc.id}')">Edit</button>
      <button class="btn-danger" onclick="deleteQuiz('${doc.id}')">Delete</button>
    `;
    quizList.appendChild(div);
  });
}

// ✅ Toggle Quiz Active Status
async function toggleQuiz(id, state) {
  await db.collection('quizzes').doc(id).update({ active: state });
  loadQuizzes();
}

// ✅ Edit Quiz
async function editQuiz(id) {
  const docSnap = await db.collection('quizzes').doc(id).get();
  if (!docSnap.exists) return alert("❌ Quiz not found!");
  const quiz = docSnap.data();
  editQuizId = id;

  quizForm.quizTitle.value = quiz.title;
  quizForm.quizDuration.value = quiz.duration;
  quizForm.quizMarks.value = quiz.marks;
  quizDept.value = quiz.department;
  quizForm.startAt.value = quiz.startAt ? new Date(quiz.startAt.seconds * 1000).toISOString().slice(0, 16) : '';
  quizForm.endAt.value = quiz.endAt ? new Date(quiz.endAt.seconds * 1000).toISOString().slice(0, 16) : '';
  questionsContainer.innerHTML = '';
  quiz.questions.forEach(q => addQuestionField(q));
  quizForm.querySelector('button[type="submit"]').textContent = "Update Quiz";
  window.scrollTo({ top: 2000, behavior: 'smooth' });
}

// ✅ Delete Quiz
async function deleteQuiz(id) {
  if (confirm("🗑️ Delete this quiz?")) {
    await db.collection('quizzes').doc(id).delete();
    loadQuizzes();
  }
}
