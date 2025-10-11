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


async function loadActiveQuiz() {
  try {
    const now = new Date();

    // 🔹 Fetch the student's department
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      alert("Student record not found.");
      return;
    }
    const studentDept = studentSnap.data().department;

    // 🔹 Fetch all active quizzes
    const snapshot = await db.collection('quizzes')
      .where('active', '==', true)
      .get();

    if (snapshot.empty) {
      quizContainer.innerHTML = '<p>No asignment available at the moment.</p>';
      return;
    }

    // 🔹 Separate quizzes
    const upcomingQuizzes = [];
    const availableQuizzes = [];

    snapshot.docs.forEach(doc => {
      const q = { id: doc.id, ...doc.data() };
      const dept = q.department ? q.department.toLowerCase() : "";
      const departmentMatch = dept.includes("all") || q.department === studentDept;

      if (!departmentMatch) return;

      const start = q.startAt ? q.startAt.toDate() : null;
      const end = q.endAt ? q.endAt.toDate() : null;
      const isUpcoming = start && now < start;
      const isAvailable =
        (!start || now >= start) && (!end || now <= end);

      if (isUpcoming) upcomingQuizzes.push(q);
      else if (isAvailable) availableQuizzes.push(q);
    });

    // 🔹 Build container structure
    quizContainer.innerHTML = `
      <h3>Available Quizzes</h3>
      <div id="availableList" class="quiz-list"></div>
      <hr>
      <h3>Upcoming Quizzes</h3>
      <div id="upcomingList" class="quiz-list"></div>
    `;

    const availableList = document.getElementById('availableList');
    const upcomingList = document.getElementById('upcomingList');

    // 🟢 Available Quizzes
    if (availableQuizzes.length === 0) {
      availableList.innerHTML = `<p>No assignment available right now.</p>`;
    } else {
      for (const quiz of availableQuizzes) {
        const attemptSnap = await studentRef
          .collection("quizHistory")
          .where("quizId", "==", quiz.id)
          .limit(1)
          .get();
        const alreadyTaken = !attemptSnap.empty;

        const div = document.createElement('div');
        div.className = 'quiz-card';
        div.innerHTML = `
          <h4>${quiz.title}</h4>
          <p><strong>Marks:</strong> ${quiz.marks} marks</p>
          <p><strong>Department:</strong> ${quiz.department}</p>
          <p><strong>Duration:</strong> ${quiz.duration} mins</p>
          <p><strong>Available:</strong> ${
            quiz.startAt ? quiz.startAt.toDate().toLocaleString() : "Now"
          } - ${
            quiz.endAt ? quiz.endAt.toDate().toLocaleString() : "No End Date"
          }</p>
          ${
            alreadyTaken
              ? `<p style="color:gray;">You have already taken this quiz ✅</p>`
              : `<button class="buttonx" onclick="startSelectedQuiz('${quiz.id}')">Start Quiz</button>`
          }
        `;
        availableList.appendChild(div);
      }
    }

    // 🕒 Upcoming Quizzes
    if (upcomingQuizzes.length === 0) {
      upcomingList.innerHTML = `<p>No upcoming quizzes scheduled.</p>`;
    } else {
      for (const quiz of upcomingQuizzes) {
        const startAt = quiz.startAt.toDate();
        const div = document.createElement('div');
        div.className = 'quiz-card upcoming';
        const countdownId = `countdown-${quiz.id}`;

        div.innerHTML = `
          <h4>${quiz.title}</h4>
          <p><strong>Department:</strong> ${quiz.department}</p>
          <p><strong>Starts At:</strong> ${startAt.toLocaleString()}</p>
          <p id="${countdownId}" style="color:teal;font-weight:bold;">Loading countdown...</p>
        `;

        upcomingList.appendChild(div);

        // Start countdown
        const updateCountdown = () => {
          const now = new Date().getTime();
          const distance = startAt.getTime() - now;

          if (distance <= 0) {
            clearInterval(timer);
            div.innerHTML = `
              <h4>${quiz.title}</h4>
              <p><strong>Department:</strong> ${quiz.marks}</p>
              <p><strong>Department:</strong> ${quiz.department}</p>
              <p>Quiz is now available ✅</p>
              <button class="buttonx" onclick="startSelectedQuiz('${quiz.id}')">Start Quiz</button>
            `;
            return;
          }

          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          const iconTime =`<i class="bi bi-alarm"></i>`

          document.getElementById(countdownId).innerHTML =
            `${iconTime} Starts in ${hours}h ${minutes}m ${seconds}s`;
        };

        const timer = setInterval(updateCountdown, 1000);
        updateCountdown();
      }
    }

  } catch (error) {
    console.error("Error loading quizzes:", error);
    quizContainer.innerHTML = `<p>Error loading quizzes. Please refresh.</p>`;
  }
}



async function startSelectedQuiz(quizId) {
  try {
    const doc = await db.collection('quizzes').doc(quizId).get();
    if (!doc.exists) {
      alert("Quiz not found or no longer active.");
      return;
    }

    quizData = doc.data();
    quizData.id = doc.id;

    quizData.marks = quizData.marks || quizData.questions.length; // fallback if missing
    quizData.markPerQuestion = quizData.marks / quizData.questions.length;

    // Randomize questions and options
    quizData.questions.sort(() => Math.random() - 0.5);
    quizData.questions.forEach(q => q.options.sort(() => Math.random() - 0.5));

    current = 0;
    score = 0;
    showQuestion();
    startTimer(quizData.duration * 60);

  } catch (error) {
    console.error("Error starting quiz:", error);
    alert("Error loading quiz. Please try again.");
  }
}



// 🧠 Show question with progress and navigation
function showQuestion() {
  if (!quizData || current >= quizData.questions.length) {
    submitQuiz();
    return;
  }

  const q = quizData.questions[current];
  const total = quizData.questions.length;
  const progressPercent = ((current + 1) / total) * 100;

  quizContainer.innerHTML = `
    <div class="progress-container" style="margin-bottom:10px;">
      <div style="background:#ddd; border-radius:10px; height:10px;">
        <div style="width:${progressPercent}%; height:10px; background:teal; border-radius:10px; transition:width 0.3s;"></div>
      </div>
      <p style="text-align:right; font-size:14px; color:#333; margin-top:5px;">
        Question ${current + 1} of ${total}
      </p>
    </div>

    <div class="question"><strong>Q${current + 1}: ${q.q}</strong></div>
    ${q.options.map(o => `
      <label class="option">
        <input type="radio" name="opt" value="${o}" ${q.selected === o ? "checked" : ""}> ${o}
      </label><br>
    `).join('')}
    <br>

    <div class="nav-buttons" style="margin-top:15px; display:flex; justify-content:space-between;">
      ${current > 0 
        ? `<button id="prevBtn" class="buttonx secondary" style="background:#ccc; color:#000;">Previous</button>` 
        : `<div></div>`
      }
      <button id="nextBtn" class="buttonx">
        ${current === total - 1 ? "Submit Quiz" : "Next"}
      </button>
    </div>
  `;

  if (current > 0) {
    document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  }
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
}

// ⏭️ Next Question
function nextQuestion() {
  const selected = document.querySelector('input[name="opt"]:checked');
  if (selected) quizData.questions[current].selected = selected.value;
  if (current < quizData.questions.length - 1) {
    current++;
    showQuestion();
  } else {
    submitQuiz();
  }
}

// ⏮️ Previous Question
function prevQuestion() {
  const selected = document.querySelector('input[name="opt"]:checked');
  if (selected) quizData.questions[current].selected = selected.value;
  if (current > 0) {
    current--;
    showQuestion();
  }
}



// 🧾 Submit quiz
async function submitQuiz() {
  clearInterval(timer);

  // Recalculate score properly before marking
  let finalScore = 0;
  quizData.questions.forEach(q => {
    if (q.selected === q.answer) finalScore++;
  });
  const marksEarned = finalScore * quizData.markPerQuestion;


quizContainer.innerHTML = `
  <h3 class="h3x">Quiz Submitted ✅</h3>
  <p>Your score: <strong>${marksEarned}</strong></p>
  <p>(${score} correct out of ${quizData.questions.length} questions)</p>
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

    // Update assignment score
    await studentRef.update({
      assignment: firebase.firestore.FieldValue.increment(marksEarned),
      hasTakenQuiz: true,
      lastQuizTaken: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Add quiz record
    await studentRef.collection("quizHistory").add({
      quizId: quizData.id,
      quizTitle: quizData.title || "Untitled Quiz",
      score: marksEarned,
      total: quizData.questions.length,
      marksEarned: marksEarned.toFixed(2), // ✅ new
      totalMarks: quizData.marks,          // ✅ new
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
      // const percent = ((data.score / data.total) * 100).toFixed(1);
      // const status = percent >= 50 ? "✅ Passed" : "❌ Failed";
      const date = data.timestamp?.toDate().toLocaleString() || "—";

      const row = `
        <tr>
          <td>${data.quizTitle || data.quizId || "Untitled Quiz"}</td>
          <td>${data.marksEarned || (data.score || 0)}</td>
          <td>${data.totalMarks || data.total}</td>
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
