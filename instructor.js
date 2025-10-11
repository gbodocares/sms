// function showLoader() {
//   document.getElementById("loader").style.display = "flex";
// }

// function hideLoader() {
//   document.getElementById("loader").style.display = "none";
// }

// // Reference Firestore
// let instructorDept = document.getElementById('instructorDept').value;

// // Predefined instructors + their departments
// const instructors = {
//   daprince: "Tailoring",
//   enywealth: "Make-up",
//   chioma: "Nails Decoration",
//   fera: "Video Editing",
//   taiwo: "Videography",
//   ezekiel: "Web Design",
//   deji: "UI/UX Design",
//   sylvester: "Computer Networking"
// };

// function loginInstructor() {
//   let username = document.getElementById("username").value.trim().toLowerCase();
//   let instAll = document.getElementById("instAll");
//   let instructorLogin = document.getElementById('loginSection');

//   if (instructors[username]) {
//     // show instructor panel
//     instAll.style.display = "block";
//     instructorLogin.style.display = "none";

//     // get the department assigned to this instructor
//     let instructorDept = instructors[username];

//     // load students related to this department into table
//     firebase.firestore().collection("students1")
//       .where("department", "==", instructorDept)
//       .onSnapshot(snapshot => {
//         const studentTable = document.getElementById("studentTableBody");
//         studentTable.innerHTML = ""; // clear old data

//         snapshot.forEach(doc => {
//           const s = doc.data();
//           const row = `
//             <tr>
//               <td>${s.regNo}</td>
//               <td><img src="${s.photoURL}" alt="student photo" width="50px" height="50px"/></td>
//               <td>${s.fullName}</td>
//               <td>${s.attendance}</td>
//               <td>${s.assignment}</td>
//               <td>${s.test}</td>
//               <td>${s.totalScore}</td>
//             </tr>`;
//           studentTable.innerHTML += row;
//         });
//       });

//     // ✅ also populate student <select> field for attendance
//     const studentSelect = document.getElementById("studentId");
//     db.collection("students1")
//       .where("department", "==", instructorDept)
//       .get()
//       .then(snaps => {
//         studentSelect.innerHTML = `<option value="">-- Select Student --</option>`;
//         snaps.forEach(doc => {
//           const data = doc.data();
//           const option = document.createElement("option");
//           option.value = data.regNo;
//           option.textContent = `${data.regNo} - ${data.fullName}`;
//           studentSelect.appendChild(option);
//         });
//       });

//   } else {
//     alert("Invalid username. Contact admin.");
//   }
// }


// const db = firebase.firestore();

// /**
//  * Function to recalc total score for a student
//  */
// async function recalcTotal(studentId) {
//   try {
//     await db.runTransaction(async (transaction) => {
//       const studentRef = db.collection("students1").doc(studentId);
//       const studentDoc = await transaction.get(studentRef);

//       if (!studentDoc.exists) {
//         throw "Student not found!";
//       }

//       const data = studentDoc.data();

//       const test = data.test || 0;
//       const assignment = data.assignment || 0;
//       const attendance = data.attendance || 0;
//       const softSkill = data.softSkill || 0;
//       const finalProject = data.finalProject || 0;

//       const totalScore = test + assignment + attendance + softSkill + finalProject;

//       transaction.update(studentRef, { totalScore });
//     });

//     console.log(`✅ Total score recalculated for ${studentId}`);
//   } catch (err) {
//     console.error("Error recalculating total:", err);
//   }
// }


// // mark the attendance
// document.getElementById("attendance-form").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const studentSelect = document.getElementById("studentId");

//   const regNo = studentSelect.value.trim();
//   const attendanceScore = 0.25;

//   if (!regNo) return alert("Please select a student");

//   try {
//     showLoader();

//     const snapshot = await db.collection("students1")
//       .where("regNo", "==", regNo)
//       .limit(1)
//       .get();

//     if (snapshot.empty) {
//       alert("❌ No student found with this Reg No");
//       return;
//     }

//     const doc = snapshot.docs[0];
//     const docRef = doc.ref;
//     const data = doc.data();

//     const today = new Date().toISOString().split("T")[0];

//     if (data.lastAttendanceDate === today) {
//       alert("⚠️ Attendance already submitted for today!");
//       return;
//     }

//     await docRef.update({
//       attendance: firebase.firestore.FieldValue.increment(attendanceScore),
//       lastAttendanceDate: today // save as string
//     });

//     if (typeof recalcTotal === "function") {
//       await recalcTotal(docRef.id);
//     }

//     alert("✅ Attendance updated successfully!");
//     document.getElementById("attendance-form").reset();
//   } catch (err) {
//     console.error("Error updating attendance:", err);
//     alert("Error updating attendance");
//   } finally {
//     hideLoader();
//   }
// });




// // upload test and assignment
// document.getElementById("scores-form").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const regNo = document.getElementById("studentRegNo").value.trim();
//   const testScore = Number(document.getElementById("testScore").value) || 0;
//   const assignmentScore = Number(document.getElementById("assignmentScore").value) || 0;

//   if (!regNo) return alert("Reg No is required");

//   try {
//     showLoader(); // 🔵 show spinner before Firestore request

//     const snapshot = await db.collection("students1")
//       .where("regNo", "==", regNo)
//       .limit(1)
//       .get();

//     if (snapshot.empty) {
//       alert("❌ No student found with this Reg No");
//       hideLoader(); // 🔴 hide loader
//       return;
//     }

//     const docRef = snapshot.docs[0].ref;

//     // Update test & assignment
//     await docRef.update({
//       test: firebase.firestore.FieldValue.increment(testScore),
//       assignment: firebase.firestore.FieldValue.increment(assignmentScore),
//     });

//     // Recalculate total
//     await recalcTotal(docRef.id);

//     alert("✅ Test & Assignment updated successfully!");
//     document.getElementById("scores-form").reset();
//   } catch (err) {
//     console.error("Error uploading scores:", err);
//     alert("Error uploading scores");
//   } finally {
//     hideLoader(); // 🟢 always hide loader at the end
//   }
// });



function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Firestore reference
const db = firebase.firestore();

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
  const username = document.getElementById("username").value.trim().toLowerCase();
  const instAll = document.getElementById("instAll");
  const instructorLogin = document.getElementById('loginSection');

  if (!instructors[username]) {
    alert("Invalid username. Contact admin.");
    return;
  }

  // Show instructor panel
  instAll.style.display = "block";
  instructorLogin.style.display = "none";

  const instructorDept = instructors[username];

  // 🔄 Real-time snapshot for student list + rankings
  db.collection("students1")
    .where("department", "==", instructorDept)
    .onSnapshot(snapshot => {
      const studentTable = document.getElementById("studentTableBody");
      studentTable.innerHTML = ""; // clear old data

      const students = [];
      snapshot.forEach(doc => {
        const s = doc.data();
        students.push({ id: doc.id, ...s });
      });

      // Sort by totalScore descending
      students.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

      // Assign ranks and display
      students.forEach((s, index) => {
        const rank = index + 1;
        let medal = "";

        // 🎖 Assign medals for top 3
        if (rank === 1) medal = "1st🥇";
        else if (rank === 2) medal = "2nd🥈";
        else if (rank === 3) medal = "3rd🥉";
        else medal = rank;

        const row = `
          <tr>
            <td style="font-weight:bold;">${medal}</td>
            <td>${s.regNo}</td>
            <td><img src="${s.photoURL}" alt="student photo" width="45px" height="45px" style="border-radius:50%;object-fit:cover"/></td>
            <td>${s.fullName}</td>
            <td>${s.attendance || 0}</td>
            <td>${s.assignment || 0}</td>
            <td>${s.test || 0}</td>
            <td>${s.softSkill || 0}</td>
            <td>${s.finalProject || 0}</td>
            <td style="font-weight:bold;">${s.totalScore || 0}</td>
          </tr>`;
        studentTable.innerHTML += row;
      });

      // 🏆 Display top student
      const topDiv = document.getElementById("topStudent");
      if (students.length > 0) {
        const topStudent = students[0];
        topDiv.innerHTML = `
          🏆 <b>Top Student:</b> ${topStudent.fullName} (${topStudent.regNo}) 
          with <b>${topStudent.totalScore || 0}</b> points.
        `;
      } else {
        topDiv.innerHTML = "No students available in this department yet.";
      }
    });

  // ✅ populate student select for attendance form
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
}


/**
 * 🔢 Function to recalc total score for a student
 */
async function recalcTotal(studentId) {
  try {
    await db.runTransaction(async (transaction) => {
      const studentRef = db.collection("students1").doc(studentId);
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists) throw "Student not found!";

      const data = studentDoc.data();

      const totalScore =
        (data.test || 0) +
        (data.assignment || 0) +
        (data.attendance || 0) +
        (data.softSkill || 0) +
        (data.finalProject || 0);

      transaction.update(studentRef, { totalScore });
    });

    console.log(`✅ Total score recalculated for ${studentId}`);
  } catch (err) {
    console.error("Error recalculating total:", err);
  }
}


/**
 * 🕒 Attendance update form
 */
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
      lastAttendanceDate: today
    });

    await recalcTotal(docRef.id);

    alert("✅ Attendance updated successfully!");
    document.getElementById("attendance-form").reset();
  } catch (err) {
    console.error("Error updating attendance:", err);
    alert("Error updating attendance");
  } finally {
    hideLoader();
  }
});


/**
 * 🧮 Upload test and assignment form
 */
document.getElementById("scores-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const regNo = document.getElementById("studentRegNo").value.trim();
  const testScore = Number(document.getElementById("testScore").value) || 0;
  const assignmentScore = Number(document.getElementById("assignmentScore").value) || 0;

  if (!regNo) return alert("Reg No is required");

  try {
    showLoader();

    const snapshot = await db.collection("students1")
      .where("regNo", "==", regNo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      alert("❌ No student found with this Reg No");
      hideLoader();
      return;
    }

    const docRef = snapshot.docs[0].ref;

    await docRef.update({
      test: firebase.firestore.FieldValue.increment(testScore),
      assignment: firebase.firestore.FieldValue.increment(assignmentScore)
    });

    await recalcTotal(docRef.id);

    alert("✅ Test & Assignment updated successfully!");
    document.getElementById("scores-form").reset();
  } catch (err) {
    console.error("Error uploading scores:", err);
    alert("Error uploading scores");
  } finally {
    hideLoader();
  }
});
