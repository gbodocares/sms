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
const searchInput = document.getElementById("searchInput");

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

db.collection("students1").onSnapshot(snapshot => {
  tableBody.innerHTML = ""; 

  snapshot.forEach(doc => {
    const data = doc.data();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.regNo}</td>
      <td>${data.fullName}</td>
      <td>${data.email}</td>
      <td>${data.phone}</td>
      <td>${data.department}</td>
      <div>
         <td style="display: flex;">
            <button style="background-color: transparent; color: teal" class="editBtn"><i class="bi bi-pencil"></i></button>
            <button style="background-color: transparent; color: red" class="delBtn"><i class="bi bi-trash3"></i></button>
        </td>
      </div>
     
    `;

    // Edit button → open modal
    row.querySelector(".editBtn").onclick = () => {
      document.getElementById("editStudentId").value = doc.id;
      document.getElementById("editRegNo").value = data.regNo;
      document.getElementById("editFullName").value = data.fullName;
      document.getElementById("editEmail").value = data.email;
      document.getElementById("editPhone").value = data.phone;
      document.getElementById("editDept").value = data.department;

      editModal.style.display = "block"; // show modal
    };

    // Delete button
    row.querySelector(".delBtn").onclick = () => {
      if (confirm("Are you sure you want to delete this student?")) {
        db.collection("students1").doc(doc.id).delete();
      }
    };

    tableBody.appendChild(row);
  });

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
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // Clear existing rows

  snapshot.forEach(doc => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.regNo || ""}</td>
      <td><img width="50px" height="50px" src=${data.photoURL || ""} alt="" /></td>
      <td>${data.fullName || ""}</td>
      <td>${data.department || ""}</td>
      <td>${data.groupId || ""}</td>
      <td>${data.attendance || "0"}</td>
      <td>${data.test || "0"}</td>
      <td>${data.assignment || "0"}</td>
      <td>${data.softSkill || "0"}</td>
      <td>${data.finalProject || "0"}</td>
      <td style="font-weight: bold; color: #800020;">${data.totalScore || "0"}</td>
    `;

    tableBody.appendChild(row);
  });

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
});







  // `<td>
  //     <button style="background-color: transparent; color: teal" class="editBtn"><i class="bi bi-pencil"></i></button>
  //     <button style="background-color: transparent; color: red" class="delBtn"><i class="bi bi-trash3"></i></button>
  // </td>`