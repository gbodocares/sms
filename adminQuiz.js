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
      <button 
        style="background-color: goldenrod;" 
        onclick="handleResultsAccess('${doc.id}', '${quiz.title}', ${quiz.endAt ? quiz.endAt.seconds : 'null'})"
      >
        View Results
      </button>

      <button class="btn-danger" onclick="deleteQuiz('${doc.id}')">Delete</button>
    `;
    quizList.appendChild(div);
  });
}

function handleResultsAccess(quizId, title, endAtSeconds) {
  const now = new Date();
  const quizEnd = endAtSeconds ? new Date(endAtSeconds * 1000) : null;

  // If no end date is set, allow view (useful for manual tests)
  if (!quizEnd) return viewResults(quizId, title);

  // Check if the quiz has ended
  if (now < quizEnd) {
    const remaining = Math.ceil((quizEnd - now) / (1000 * 60));
    alert(`⏳ This quiz is still active.\nResults will be available after it ends in approximately ${remaining} minutes.`);
    return;
  }

  // Allow view after end time
  viewResults(quizId, title);
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

async function viewResults(quizId, title) {
  const modal = document.getElementById('quizResultsModal');
  const resultsBody = document.getElementById('quizResultsBody');
  const resultsQuizTitle = document.getElementById('resultsQuizTitle');

  modal.style.display = 'flex';
  resultsQuizTitle.textContent = title;
  resultsBody.innerHTML = '<tr><td colspan="5">Loading results...</td></tr>';

  try {
    const snapshot = await db.collection('quizAttempts')
      .where('quizId', '==', quizId)
      .orderBy('submittedAt', 'desc')
      .get();

    if (snapshot.empty) {
      resultsBody.innerHTML = '<tr><td colspan="5">No submissions yet.</td></tr>';
      return;
    }

    let rowsHTML = '';
    const resultsArray = [];

   const uniqueResults = {}; // store only one result per student

  snapshot.forEach(doc => {
    const data = doc.data();
    const regNo = (data.studentRegNo || '').trim().toUpperCase();

    if (!regNo) return; // skip invalid entries

    // If already seen this student, keep only the most recent
    const existing = uniqueResults[regNo];
    const currentTime = data.submittedAt?.toDate().getTime() || 0;
    const existingTime = existing?.submittedAt?.toDate().getTime() || 0;

    if (!existing || currentTime > existingTime) {
      uniqueResults[regNo] = data; // keep latest record
    }
  });

  // Now render only unique students
  Object.values(uniqueResults).forEach(data => {
    const date = data.submittedAt?.toDate().toLocaleString() || '—';
    rowsHTML += `
      <tr>
        <td>${data.studentName || '—'}</td>
        <td>${data.studentRegNo || '—'}</td>
        <td>${data.marksEarned}</td>
        <td>${data.totalMarks}</td>
        <td>${date}</td>
      </tr>
    `;

    resultsArray.push({
      Student: data.studentName || '—',
      RegNo: data.studentRegNo || '—',
      Score: data.marksEarned,
      Total: data.totalMarks,
      DateSubmitted: date
    });
  });


    resultsBody.innerHTML = rowsHTML;

    // Attach export functionality
    document.getElementById('exportCSVBtn').onclick = () => exportToCSV(title, resultsArray);

  } catch (err) {
    console.error(err);
    resultsBody.innerHTML = '<tr><td colspan="5">Error loading results!</td></tr>';
  }
}


function closeResultsModal() {
  document.getElementById('quizResultsModal').style.display = 'none';
}

function exportToCSV(quizTitle, data) {
  if (!data.length) return alert("No data to export!");

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => Object.values(obj).join(","));
  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${quizTitle.replace(/\s+/g, "_")}_Results.csv`;
  link.click();
}

