function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Reference Firestore
let instructorDept = document.getElementById('instructorDept').value;

// Predefined instructors + their departments
const instructors = {
  daprince: "Tailoring",
  enywealth: "Make-up",
  chioma: "Nails Decoration",
  fera: "Video Editing",
  taiwo: "Videography",
  ezekiel: "Web Design",
  deji: "UI/UX Design",
  sylvester: "Computer Networking"
};

function loginInstructor() {
  let username = document.getElementById("username").value.trim().toLowerCase();
  let instAll = document.getElementById("instAll");
  let instructorLogin = document.getElementById('loginSection');

  if (instructors[username]) {
    // show instructor panel
    instAll.style.display = "block";
    instructorLogin.style.display = "none";

    // get the department assigned to this instructor
    let instructorDept = instructors[username];

    // load students related to this department into table
    firebase.firestore().collection("students1")
      .where("department", "==", instructorDept)
      .onSnapshot(snapshot => {
        const studentTable = document.getElementById("studentTableBody");
        studentTable.innerHTML = ""; // clear old data

        snapshot.forEach(doc => {
          const s = doc.data();
          const row = `
            <tr>
              <td>${s.regNo}</td>
              <td><img src="${s.photoURL}" alt="student photo" width="50px" height="50px"/></td>
              <td>${s.fullName}</td>
              <td>${s.attendance}</td>
              <td>${s.assignment}</td>
              <td>${s.test}</td>
              <td>${s.totalScore}</td>
            </tr>`;
          studentTable.innerHTML += row;
        });
      });

    // ✅ also populate student <select> field for attendance
    const studentSelect = document.getElementById("studentId");
    db.collection("students1")
      .where("department", "==", instructorDept)
      .get()
      .then(snaps => {
        studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;
        snaps.forEach(doc => {
          const data = doc.data();
          const option = document.createElement("option");
          option.value = data.regNo;
          option.textContent = `${data.regNo} - ${data.fullName}`;
          studentSelect.appendChild(option);
        });
      });

  } else {
    alert("Invalid username. Contact admin.");
  }
}


const db = firebase.firestore();

/**
 * Function to recalc total score for a student
 */
async function recalcTotal(studentId) {
  try {
    await db.runTransaction(async (transaction) => {
      const studentRef = db.collection("students1").doc(studentId);
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists) {
        throw "Student not found!";
      }

      const data = studentDoc.data();

      const test = data.test || 0;
      const assignment = data.assignment || 0;
      const attendance = data.attendance || 0;
      const softSkill = data.softSkill || 0;
      const finalProject = data.finalProject || 0;

      const totalScore = test + assignment + attendance + softSkill + finalProject;

      transaction.update(studentRef, { totalScore });
    });

    console.log(`✅ Total score recalculated for ${studentId}`);
  } catch (err) {
    console.error("Error recalculating total:", err);
  }
}


// mark the attendance
document.getElementById("attendance-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const studentSelect = document.getElementById("studentId");

  const regNo = studentSelect.value.trim();
  const attendanceScore = 0.25;

  if (!regNo) return alert("Please select a student");

  try {
    showLoader();

    const snapshot = await db.collection("students1")
      .where("regNo", "==", regNo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      alert("❌ No student found with this Reg No");
      return;
    }

    const doc = snapshot.docs[0];
    const docRef = doc.ref;
    const data = doc.data();

    const today = new Date().toISOString().split("T")[0];

    if (data.lastAttendanceDate === today) {
      alert("⚠️ Attendance already submitted for today!");
      return;
    }

    await docRef.update({
      attendance: firebase.firestore.FieldValue.increment(attendanceScore),
      lastAttendanceDate: today // save as string
    });

    if (typeof recalcTotal === "function") {
      await recalcTotal(docRef.id);
    }

    alert("✅ Attendance updated successfully!");
    document.getElementById("attendance-form").reset();
  } catch (err) {
    console.error("Error updating attendance:", err);
    alert("Error updating attendance");
  } finally {
    hideLoader();
  }
});




// upload test and assignment
document.getElementById("scores-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const regNo = document.getElementById("studentRegNo").value.trim();
  const testScore = Number(document.getElementById("testScore").value) || 0;
  const assignmentScore = Number(document.getElementById("assignmentScore").value) || 0;

  if (!regNo) return alert("Reg No is required");

  try {
    showLoader(); // 🔵 show spinner before Firestore request

    const snapshot = await db.collection("students1")
      .where("regNo", "==", regNo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      alert("❌ No student found with this Reg No");
      hideLoader(); // 🔴 hide loader
      return;
    }

    const docRef = snapshot.docs[0].ref;

    // Update test & assignment
    await docRef.update({
      test: firebase.firestore.FieldValue.increment(testScore),
      assignment: firebase.firestore.FieldValue.increment(assignmentScore),
    });

    // Recalculate total
    await recalcTotal(docRef.id);

    alert("✅ Test & Assignment updated successfully!");
    document.getElementById("scores-form").reset();
  } catch (err) {
    console.error("Error uploading scores:", err);
    alert("Error uploading scores");
  } finally {
    hideLoader(); // 🟢 always hide loader at the end
  }
});



