const db = firebase.firestore();
const quizContainer = document.getElementById('quizContainer');
const timerDisplay = document.getElementById('timer');

let quizData = null, current = 0, score = 0, timer, timeLeft, studentRegNo, studentRef;

// ✅ Wait for authentication
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Please login first!");
    return;
  }

  try {
    const studentDoc = await db.collection("students1").doc(user.uid).get();
    if (!studentDoc.exists) {
      alert("Student record not found. Contact admin.");
      return;
    }

    const data = studentDoc.data();
    studentRegNo = data.regNo;
    studentRef = db.collection("students1").doc(user.uid);

    console.log("👤 Logged in student:", studentRegNo);

    await loadActiveQuiz();
    await loadQuizHistory(studentRef);

  } catch (error) {
    console.error("Error loading student data:", error);
  }
});

/**
 * 🔢 Recalculate total score for a student
 */
async function recalcTotal(studentId) {
  try {
    await db.runTransaction(async (transaction) => {
      const ref = db.collection("students1").doc(studentId);
      const doc = await transaction.get(ref);

      if (!doc.exists) throw new Error("Student not found!");

      const data = doc.data();
      const totalScore =
        (data.test || 0) +
        (data.assignment || 0) +
        (data.attendance || 0) +
        (data.softSkill || 0) +
        (data.finalProject || 0);

      transaction.update(ref, { totalScore });
    });

    console.log(`✅ Total score recalculated for ${studentId}`);
  } catch (err) {
    console.error("Error recalculating total:", err);
  }
}

// 📋 Load only active and available quiz
// async function loadActiveQuiz() {
//   try {
//     const now = new Date();
//     const snapshot = await db.collection('quizzes')
//       .where('active', '==', true)
//       .get();

//     if (snapshot.empty) {
//       quizContainer.innerHTML = '<p>No Assignment available for now.</p>';
//       return;
//     }

//     const activeQuiz = snapshot.docs.find((doc) => {
//       const q = doc.data();
//       const start = q.startAt ? q.startAt.toDate() : null;
//       const end = q.endAt ? q.endAt.toDate() : null;
//       return (!start || now >= start) && (!end || now <= end);
//     });

//     if (!activeQuiz) {
//       quizContainer.innerHTML = '<p>No quiz available for now.</p>';
//       return;
//     }

//     quizData = activeQuiz.data();
//     quizData.id = activeQuiz.id;

//     // Randomize question order and options
//     quizData.questions.sort(() => Math.random() - 0.5);
//     quizData.questions.forEach(q => q.options.sort(() => Math.random() - 0.5));

//     current = 0;
//     score = 0;

//     showQuestion();
//     startTimer(quizData.duration * 60);

//   } catch (error) {
//     console.error("Error loading quiz:", error);
//     quizContainer.innerHTML = `<p>Error loading quiz. Please refresh.</p>`;
//   }
// }

async function loadActiveQuiz() {
  try {
    const now = new Date();
    const snapshot = await db.collection('quizzes')
      .where('active', '==', true)
      .get();

    if (snapshot.empty) {
      quizContainer.innerHTML = '<p>No Assignment available for now.</p>';
      return;
    }

    const activeQuiz = snapshot.docs.find((doc) => {
      const q = doc.data();
      const start = q.startAt ? q.startAt.toDate() : null;
      const end = q.endAt ? q.endAt.toDate() : null;
      return (!start || now >= start) && (!end || now <= end);
    });

    if (!activeQuiz) {
      quizContainer.innerHTML = '<p>No quiz available for now.</p>';
      return;
    }

    quizData = activeQuiz.data();
    quizData.id = activeQuiz.id;

    // ✅ Check if student already took this quiz
    const attemptSnap = await studentRef
      .collection("quizHistory")
      .where("quizId", "==", quizData.id)
      .limit(1)
      .get();

    if (!attemptSnap.empty) {
      const data = attemptSnap.docs[0].data();
      const percent = ((data.score / data.total) * 100).toFixed(1);
      const status = percent >= 50 ? "✅ Passed" : "❌ Failed";

      quizContainer.innerHTML = `
        <div style="text-align:center;">
          <h3>You’ve already taken this quiz.</h3>
          <p><strong>Score:</strong> ${data.score}/${data.total}</p>
          <p><strong>Status:</strong> <span style="color:${percent >= 50 ? 'green' : 'red'};">${status}</span></p>
          <p><strong>Date:</strong> ${data.timestamp?.toDate().toLocaleString() || "—"}</p>
        </div>
      `;
      return; // ✅ Stop here, don’t allow taking again
    }

    // Continue if not taken
    quizData.questions.sort(() => Math.random() - 0.5);
    quizData.questions.forEach(q => q.options.sort(() => Math.random() - 0.5));
    current = 0;
    score = 0;
    showQuestion();
    startTimer(quizData.duration * 60);
  } catch (error) {
    console.error("Error loading quiz:", error);
    quizContainer.innerHTML = `<p>Error loading quiz. Please refresh.</p>`;
  }
}


// 🧠 Show question
function showQuestion() {
  if (!quizData || current >= quizData.questions.length) {
    submitQuiz();
    return;
  }

  const q = quizData.questions[current];
  quizContainer.innerHTML = `
    <div class="question"><strong>Q${current + 1}: ${q.q}</strong></div>
    ${q.options.map(o =>
      `<label class="option"><input type="radio" name="opt" value="${o}"> ${o}</label><br>`
    ).join('')}
    <br><button id="nextBtn" class="buttonx">Next</button>
  `;

  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
}

// ⏭️ Move to next question
function nextQuestion() {
  const selected = document.querySelector('input[name="opt"]:checked');
  if (!selected) {
    alert('Select an answer before proceeding.');
    return;
  }

  if (selected.value === quizData.questions[current].answer) score++;
  current++;
  showQuestion();
}

// 🧾 Submit quiz
async function submitQuiz() {
  clearInterval(timer);

  quizContainer.innerHTML = `
    <h3 class="h3x">Quiz Submitted ✅</h3>
    <p>Your score: <strong>${score}/${quizData.questions.length}</strong></p>
  `;

  try {
    console.log("Submitting quiz for:", studentRegNo);

    // Ensure studentRef exists
    if (!studentRef) {
      const snapshot = await db.collection("students1")
        .where("regNo", "==", studentRegNo)
        .limit(1)
        .get();
      if (!snapshot.empty) studentRef = snapshot.docs[0].ref;
    }

    if (!studentRef) {
      alert("Your student record could not be verified.");
      return;
    }

    // Get previous quiz history
    const historySnapshot = await studentRef.collection("quizHistory").get();
    let totalPrevScore = 0;
    historySnapshot.forEach(doc => {
      const d = doc.data();
      totalPrevScore += d.score || 0;
    });

    const newTotal = totalPrevScore + score;

    // Update assignment score
    await studentRef.update({
      assignment: newTotal,
      hasTakenQuiz: true,
      lastQuizTaken: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Add quiz record
    await studentRef.collection("quizHistory").add({
      quizId: quizData.id,
      quizTitle: quizData.title || "Untitled Quiz",
      score,
      total: quizData.questions.length,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Log general attempt
    await db.collection("quizAttempts").add({
      studentRegNo,
      quizId: quizData.id,
      score,
      total: quizData.questions.length,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ Recalculate totalScore field in Firestore
    await recalcTotal(studentRef.id);

    console.log("✅ Quiz submitted & total recalculated successfully!");
    alert("Quiz submitted successfully!");

  } catch (err) {
    console.error("Error saving quiz result:", err);
    alert("⚠️ Error saving your result. Contact admin.");
  }
}

// 🧾 Load quiz history
async function loadQuizHistory(studentRef) {
  const tbody = document.getElementById("quizHistoryBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const snapshot = await studentRef.collection("quizHistory")
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5">No quiz history yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const percent = ((data.score / data.total) * 100).toFixed(1);
      const status = percent >= 50 ? "✅ Passed" : "❌ Failed";
      const date = data.timestamp?.toDate().toLocaleString() || "—";

      const row = `
        <tr>
          <td>${data.quizTitle || data.quizId || "Untitled Quiz"}</td>
          <td>${data.score}</td>
          <td>${data.total}</td>
          <td style="color:${percent >= 50 ? 'green' : 'red'};">${status}</td>
          <td>${date}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  } catch (err) {
    console.error("Error loading quiz history:", err);
    tbody.innerHTML = `<tr><td colspan="5">⚠️ Error loading history.</td></tr>`;
  }
}

// 🕒 Timer
function startTimer(seconds) {
  timeLeft = seconds;
  clearInterval(timer);

  timer = setInterval(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;

    if (--timeLeft < 0) submitQuiz();
  }, 1000);
}

// 🚫 Auto-submit if tab is switched
document.addEventListener('visibilitychange', () => {
  if (document.hidden) submitQuiz();
});
