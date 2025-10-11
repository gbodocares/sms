const quizForm = document.getElementById('quizForm');
const quizList = document.getElementById('quizList');

let editQuizId = null; // Track which quiz is being edited

// ✅ Load all quizzes
async function loadQuizzes() {
  quizList.innerHTML = '';
  const snapshot = await db.collection('quizzes').orderBy('createdAt', 'desc').get();
  snapshot.forEach(doc => {
    const quiz = doc.data();
    const div = document.createElement('div');
    div.className = 'quiz-item';
    div.innerHTML = `
      <strong>${quiz.title}</strong><br>
      Duration: ${quiz.duration} mins | Dept: ${quiz.department}<br>
      Marks: ${quiz.marks || 'N/A'}<br>
      Active: ${quiz.active ? '✅' : '❌'}<br>
      <button style="background-color: salmon;" onclick="toggleQuiz('${doc.id}', ${!quiz.active})">
        ${quiz.active ? 'Deactivate' : 'Activate'}
      </button>
      <button style="background-color: teal;" onclick="editQuiz('${doc.id}')">Edit</button>
      <button class="btn-danger" onclick="deleteQuiz('${doc.id}')">Delete</button>
    `;
    quizList.appendChild(div);
  });
}

// ✅ Handle form submission (create or update)
quizForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    const questions = JSON.parse(document.getElementById('quizQuestions').value);
    const deptValue = quizForm.quizDept.value.trim();
    const department = deptValue.toLowerCase().includes("all") ? "All Departments" : deptValue;

    const quizData = {
      title: quizForm.quizTitle.value,
      duration: parseInt(quizForm.quizDuration.value),
      department,
      marks: parseInt(quizForm.quizMarks.value),
      startAt: quizForm.startAt.value ? new Date(quizForm.startAt.value) : null,
      endAt: quizForm.endAt.value ? new Date(quizForm.endAt.value) : null,
      questions,
      createdAt: new Date()
    };

    if (editQuizId) {
      // Update quiz
      await db.collection('quizzes').doc(editQuizId).update(quizData);
      alert("✅ Quiz updated successfully!");
      cancelEditMode();
    } else {
      // Create new quiz
      await db.collection('quizzes').add({
        ...quizData,
        active: false,
      });
      alert("✅ Quiz created successfully!");
    }

    quizForm.reset();
    loadQuizzes();

  } catch (err) {
    console.error(err);
    alert("⚠️ Invalid question format or input error!");
  }
};

// ✅ Toggle quiz active status
async function toggleQuiz(id, state) {
  await db.collection('quizzes').doc(id).update({ active: state });
  loadQuizzes();
}

// ✅ Delete quiz
async function deleteQuiz(id) {
  if (confirm("🗑️ Delete this quiz?")) {
    await db.collection('quizzes').doc(id).delete();
    loadQuizzes();
  }
}

// ✅ Edit quiz
async function editQuiz(id) {
  const doc = await db.collection('quizzes').doc(id).get();
  if (!doc.exists) return alert("❌ Quiz not found!");

  const quiz = doc.data();
  editQuizId = id;

  // Fill form with quiz data
  quizForm.quizTitle.value = quiz.title;
  quizForm.quizDuration.value = quiz.duration;
  quizForm.quizMarks.value = quiz.marks;
  quizForm.quizDept.value = quiz.department;
  quizForm.startAt.value = quiz.startAt ? new Date(quiz.startAt.seconds * 1000).toISOString().slice(0, 16) : '';
  quizForm.endAt.value = quiz.endAt ? new Date(quiz.endAt.seconds * 1000).toISOString().slice(0, 16) : '';
  quizForm.quizQuestions.value = JSON.stringify(quiz.questions, null, 2);

  // Visual edit indicator
  quizForm.style.border = "2px solid gold";
  quizForm.style.padding = "15px";
  quizForm.style.borderRadius = "10px";
  quizForm.style.backgroundColor = "#fff9e6";

  if (!document.getElementById('editIndicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'editIndicator';
    indicator.textContent = "✏️ Editing Existing Quiz";
    indicator.style.color = "#b58900";
    indicator.style.fontWeight = "bold";
    indicator.style.marginBottom = "10px";
    indicator.style.textAlign = "center";
    quizForm.prepend(indicator);
  }

  // Change button text
  quizForm.querySelector('button[type="submit"]').textContent = "Update Quiz";

  // Add cancel button if not already there
  if (!document.getElementById('cancelEditBtn')) {
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelEditBtn';
    cancelBtn.type = 'button';
    cancelBtn.className = 'buttonx btn-secondary';
    cancelBtn.textContent = 'Cancel Edit';
    cancelBtn.onclick = cancelEditMode;
    quizForm.appendChild(cancelBtn);
  }

  window.scrollTo({ top: 2000, behavior: 'smooth' });
}

// ✅ Cancel edit mode
function cancelEditMode() {
  editQuizId = null;
  quizForm.reset();
  quizForm.querySelector('button[type="submit"]').textContent = "Create Quiz";
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.remove();

  // Remove visual indicator
  const indicator = document.getElementById('editIndicator');
  if (indicator) indicator.remove();
  quizForm.style.border = "";
  quizForm.style.backgroundColor = "";
}

loadQuizzes();
