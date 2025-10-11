 const quizForm = document.getElementById('quizForm');
    const quizList = document.getElementById('quizList');

    async function loadQuizzes() {
      quizList.innerHTML = '';
      const snapshot = await db.collection('quizzes').get();
      snapshot.forEach(doc => {
        const quiz = doc.data();
        const div = document.createElement('div');
        div.className = 'quiz-item';
        div.innerHTML = `
          <strong>${quiz.title}</strong><br>
          Duration: ${quiz.duration} mins | Dept: ${quiz.department}<br>
          Active: ${quiz.active ? '✅' : '❌'}<br>
          <button onclick="toggleQuiz('${doc.id}', ${!quiz.active})">${quiz.active ? 'Deactivate' : 'Activate'}</button>
          <button class="btn-danger" onclick="deleteQuiz('${doc.id}')">Delete</button>
        `;
        quizList.appendChild(div);
      });
    }

    quizForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const questions = JSON.parse(document.getElementById('quizQuestions').value);
        await db.collection('quizzes').add({
          title: quizForm.quizTitle.value,
          duration: parseInt(quizForm.quizDuration.value),
          department: quizForm.quizDept.value,
          startAt: quizForm.startAt.value ? new Date(quizForm.startAt.value) : null,
          endAt: quizForm.endAt.value ? new Date(quizForm.endAt.value) : null,
          questions,
          active: false,
          createdAt: new Date()
        });
        alert("Quiz created successfully!");
        quizForm.reset();
        loadQuizzes();
      } catch (err) {
        alert("Invalid question format");
      }
    };

    async function toggleQuiz(id, state) {
      await db.collection('quizzes').doc(id).update({ active: state });
      loadQuizzes();
    }

    async function deleteQuiz(id) {
      if (confirm("Delete this quiz?")) {
        await db.collection('quizzes').doc(id).delete();
        loadQuizzes();
      }
    }

    loadQuizzes();