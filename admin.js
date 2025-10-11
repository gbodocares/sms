function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}


// Existing references
const addForm = document.getElementById("addStudentForm");
const editForm = document.getElementById("editStudentForm");
const studentList = document.getElementById("studentList");
const editSection = document.getElementById("editSection");


// 🔹 New reference for score form
const adminScoreForm = document.getElementById("adminScoreForm");

// Add Student
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const regNo = document.getElementById("studentRegNo").value;
  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("studentEmail").value;
  const phone = document.getElementById("studentPhone").value;
  const password = document.getElementById("studentPassword").value;
  const dept = document.getElementById("studentDept").value;
  const photoFile = document.getElementById("profilePhoto").files[0];

  if (!photoFile) {
    return alert("Please select a profile photo");
  }

  try {
    showLoader(); // 🔵 show loader before starting Firebase ops

    // Create user
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);

    // Upload photo to Firebase Storage
    const storageRef = firebase.storage().ref(`students1/${cred.user.uid}/profile.jpg`);
    await storageRef.put(photoFile);

    // Get download URL
    const photoURL = await storageRef.getDownloadURL();

    // Save student profile in Firestore
    await firebase.firestore().collection("students1").doc(cred.user.uid).set({
      regNo: regNo,
      fullName: fullName,
      email: email,
      role: "student",
      department: dept,
      phone: phone,
      photoURL: photoURL,
      createdAt: new Date(),

      test: 0,
      assignment: 0,
      softSkill: 0,
      finalProject: 0,
      attendance: 0,
      totalScore: 0
    });

    alert("✅ Student added!");
    addForm.reset();
  } catch (err) {
    console.error("Registration error:", err);
    alert(err.message);
  } finally {
    hideLoader(); // 🟢 always hide loader whether success or error
  }
});





const db = firebase.firestore();
const tableBody = document.getElementById("studentTableBodyEdit");
const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const saveEditBtn = document.getElementById("saveEditBtn");
const searchInput = document.getElementById("searchInput");

let allStudents = []; // store all fetched students here

// 🔹 Fetch & listen to Firestore updates
db.collection("students1").onSnapshot(snapshot => {
  allStudents = []; // reset
  snapshot.forEach(doc => {
    allStudents.push({ id: doc.id, ...doc.data() });
  });
});

// 🔹 Render filtered results only when searching
function renderFilteredStudents(filter) {
  tableBody.innerHTML = ""; // clear old rows

  const filtered = allStudents.filter(student =>
    `${student.regNo} ${student.fullName} ${student.department} ${student.groupId}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    // show no result message
    const noRow = document.createElement("tr");
    noRow.innerHTML = `
      <td colspan="11" style="text-align:center; color:gray; padding:15px;">
        No results found for "<strong>${filter}</strong>"
      </td>`;
    tableBody.appendChild(noRow);
    return;
  }

  filtered.forEach(data => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="border:1px solid black !important;">${data.regNo}</td>
      <td style="border:1px solid black !important;"><img src="${data.photoURL}" alt="student photo" width="50px" height="50px" style="border-radius:6px;"/></td>
      <td style="border:1px solid black !important;">${data.fullName}</td>
      <td style="border:1px solid black !important;">${data.department}</td>
      <td style="border:1px solid black !important;">${data.groupId}</td>
      <td style="border:1px solid black !important;">${data.attendance}</td>
      <td style="border:1px solid black !important;">${data.assignment}</td>
      <td style="border:1px solid black !important;">${data.test}</td>
      <td style="border:1px solid black !important;">${data.softSkill}</td>
      <td style="border:1px solid black !important;">${data.finalProject}</td>
      <td style="border:1px solid black !important;" style="color: teal; font-weight: bold;">${data.totalScore}</td>
      <td style="display:flex; border:1px solid black !important;">
        <button style="background-color: transparent; color: teal" class="editBtn"><i class="bi bi-pencil"></i></button>
        <button style="background-color: transparent; color: red" class="delBtn"><i class="bi bi-trash3"></i></button>
      </td>
    `;

    // 🔸 Edit button → open modal
    row.querySelector(".editBtn").onclick = () => {
      document.getElementById("editStudentId").value = data.id;
      document.getElementById("editRegNo").value = data.regNo;
      document.getElementById("editFullName").value = data.fullName;
      document.getElementById("editEmail").value = data.email;
      document.getElementById("editPhone").value = data.phone;
      document.getElementById("editDept").value = data.department;
      editModal.style.display = "block";
    };

    // 🔸 Delete button → remove record
    row.querySelector(".delBtn").onclick = () => {
      if (confirm("Are you sure you want to delete this student?")) {
        db.collection("students1").doc(data.id).delete();
      }
    };

    tableBody.appendChild(row);
  });
}

// 🔹 Search functionality
searchInput.addEventListener("keyup", function() {
  const filter = this.value.trim();
  if (filter.length === 0) {
    tableBody.innerHTML = ""; // clear table when search input is empty
  } else {
    renderFilteredStudents(filter);
  }
});


// Close modal on X click
closeModal.onclick = () => {
  editModal.style.display = "none";
};

// Close modal if you click outside the box
window.onclick = (event) => {
  if (event.target === editModal) {
    editModal.style.display = "none";
  }
};

// Save changes
saveEditBtn.onclick = async () => {
  const id = document.getElementById("editStudentId").value;

  // Show loader
  document.getElementById("loader").classList.add("active");
  saveEditBtn.disabled = true;
  saveEditBtn.innerText = "Saving...";

  try {
    await db.collection("students1").doc(id).update({
      regNo: document.getElementById("editRegNo").value,
      fullName: document.getElementById("editFullName").value,
      email: document.getElementById("editEmail").value,
      phone: document.getElementById("editPhone").value,
      department: document.getElementById("editDept").value,
    });

    alert("✅ Student updated successfully!");
    editModal.style.display = "none";
  } catch (err) {
    console.error("Error updating student:", err);
    alert("❌ Error updating student, please try again.");
  } finally {
    // Hide loader
    document.getElementById("loader").classList.remove("active");
    saveEditBtn.disabled = false;
    saveEditBtn.innerText = "Save";
  }
};


// 🔹 Upload Scores (attendance, test, assignments, soft skill, final project)
adminScoreForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const regNo = document.getElementById("adminStudentId").value.trim(); // it's actually regNo

  const attendance = parseFloat(document.getElementById("adminAttendance").value) || 0;
  const test = parseFloat(document.getElementById("adminTest").value) || 0;
  const assignment = parseFloat(document.getElementById("adminAssignment").value) || 0;
  const softSkill = parseFloat(document.getElementById("adminSoftSkill").value) || 0;
  const finalProject = parseFloat(document.getElementById("adminFinalProject").value) || 0;

  if (!regNo) return alert("Reg No is required");

  const db = firebase.firestore();

  // Show loader + disable button
  const loader = document.getElementById("loader");
  loader.classList.add("active");

  const submitBtn = adminScoreForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerText = "Saving...";

  // Find student by regNo
  db.collection("students1").where("regNo", "==", regNo).limit(1).get()
    .then(snapshot => {
      if (snapshot.empty) {
        alert("❌ No student found with this Reg No");
        return;
      }

      const docRef = snapshot.docs[0].ref;
      const current = snapshot.docs[0].data();

      // calculate new scores
      const newAttendance   = (current.attendance   || 0) + attendance;
      const newTest         = (current.test         || 0) + test;
      const newAssignment   = (current.assignment   || 0) + assignment;
      const newSoftSkill    = (current.softSkill    || 0) + softSkill;
      const newFinalProject = (current.finalProject || 0) + finalProject;

      const totalScore = newAttendance + newTest + newAssignment + newSoftSkill + newFinalProject;

      // update Firestore with absolute values
      return docRef.update({
        attendance: newAttendance,
        test: newTest,
        assignment: newAssignment,
        softSkill: newSoftSkill,
        finalProject: newFinalProject,
        totalScore: totalScore
      });
    })
    .then(() => {
      alert("✅ Scores uploaded successfully!");
      adminScoreForm.reset();
    })
    .catch(err => {
      console.error("Error uploading scores:", err);
      alert("❌ Error uploading scores.");
    })
    .finally(() => {
      // Hide loader + re-enable button
      loader.classList.remove("active");
      submitBtn.disabled = false;
      submitBtn.innerText = "Save Scores";
    });
});



firebase.firestore().collection("students1").onSnapshot(snapshot => {
  

  // Run filtering whenever the user types
  searchInput.addEventListener("keyup", function() {
    const filter = searchInput.value.toLowerCase();
    const rows = tableBody.getElementsByTagName("tr");

    Array.from(rows).forEach(row => {
      const text = row.textContent.toLowerCase();
      if (text.includes(filter)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

   // ======================  DEPARTMENT RANKINGS SECTION ======================
const rankingContainer = document.getElementById("rankingTablesContainer");

// Function to render department tables dynamically
function renderDepartmentRankings(students) {
  rankingContainer.innerHTML = ""; // Clear existing

  // Group students by department
  const departments = {};
  students.forEach((s) => {
    const dept = s.department || "Unknown";
    if (!departments[dept]) departments[dept] = [];
    departments[dept].push(s);
  });

  // Generate a table for each department
  Object.keys(departments).forEach((dept) => {
    const deptStudents = departments[dept].sort(
      (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
    );

    // Create a unique collapse ID for this department
    const collapseId = `collapse-${dept.replace(/\s+/g, "_").toLowerCase()}`;
    const headingId = `heading-${dept.replace(/\s+/g, "_").toLowerCase()}`;

    // Create table container
    const container = document.createElement("div");
    container.classList.add("accordion", "accordion-flush");
    container.innerHTML = `
      <div class="accordion-item" style="margin-bottom: 15px;">
        <h2 class="accordion-header" id="${headingId}">
          <button class="accordion-button collapsed" type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${collapseId}"
            aria-expanded="false"
            aria-controls="${collapseId}">
            ${dept.toUpperCase()} Department
          </button>
        </h2>

        <div id="${collapseId}" class="accordion-collapse collapse"
             aria-labelledby="${headingId}">
          <div class="accordion-body">
            <div style="margin-bottom: 10px;">
              <button class="downloadPDFBtn" data-dept="${dept}"
                style="background:teal; color:white; border:none; padding:6px 12px; margin-right:6px; border-radius:4px;">
                Download PDF
              </button>
              <button class="downloadExcelBtn" data-dept="${dept}"
                style="background:#800020; color:white; border:none; padding:6px 12px; border-radius:4px;">
                Download Excel
              </button>
            </div>

            <table border="1" cellpadding="8" cellspacing="0" width="100%"
              style="border-collapse:collapse; text-align:left; margin-top:10px;">
              <thead style="background-color:#f4f4f4;">
                <tr>
                  <th>Rank</th>
                  <th>Reg No</th>
                  <th>Full Name</th>
                  <th>Total Score</th>
                </tr>
              </thead>
              <tbody id="tableBody-${dept.replace(/\s+/g, '_')}">
                ${deptStudents
                  .map(
                    (s, i) => `
                    <tr>
                      <td style="border:1px solid black !important;"><strong>${i + 1}</strong></td>
                      <td style="border:1px solid black !important;">${s.regNo}</td>
                      <td style="border:1px solid black !important;">${s.fullName}</td>
                      <td style="font-weight:bold; color:#800020; border:1px solid black !important;">${s.totalScore || 0}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    rankingContainer.appendChild(container);
  });

  // Attach export button listeners
  attachExportListeners(departments);
}


      // ====================== 🔹 EXPORT FUNCTIONS ======================

      // Export handlers
      function attachExportListeners(departments) {
        // PDF
        document.querySelectorAll(".downloadPDFBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dept = btn.getAttribute("data-dept");
            downloadDeptAsPDF(dept, departments[dept]);
          });
        });

        // Excel
        document.querySelectorAll(".downloadExcelBtn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const dept = btn.getAttribute("data-dept");
            downloadDeptAsExcel(dept, departments[dept]);
          });
        });
      }

      // PDF export using jsPDF
      function downloadDeptAsPDF(dept, students) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`${dept.toUpperCase()} Department Rankings`, 10, 15);

        const rows = students.map((s, i) => [
          i + 1,
          s.regNo || "",
          s.fullName || "",
          s.totalScore || 0,
        ]);

        doc.autoTable({
          head: [["Rank", "Reg No", "Full Name", "Total Score"]],
          body: rows,
          startY: 25,
        });

        doc.save(`${dept}_Rankings.pdf`);
      }

      // Excel export using SheetJS
      function downloadDeptAsExcel(dept, students) {
        const wb = XLSX.utils.book_new();
        const data = [["Rank", "Reg No", "Full Name", "Total Score"]];

        students.forEach((s, i) => {
          data.push([i + 1, s.regNo, s.fullName, s.totalScore || 0]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Rankings");
        XLSX.writeFile(wb, `${dept}_Rankings.xlsx`);
      }

      // ====================== 🔹 REALTIME DATA FETCH ======================
      firebase.firestore().collection("students1").onSnapshot((snapshot) => {
        const allStudents = [];
        snapshot.forEach((doc) => allStudents.push(doc.data()));
        renderDepartmentRankings(allStudents);
      });

});







  // `<td>
  //     <button style="background-color: transparent; color: teal" class="editBtn"><i class="bi bi-pencil"></i></button>
  //     <button style="background-color: transparent; color: red" class="delBtn"><i class="bi bi-trash3"></i></button>
  // </td>`