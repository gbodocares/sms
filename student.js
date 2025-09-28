
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}



firebase.auth().onAuthStateChanged(user => {
  if (!user) return alert("Please login first!");

  const studentRef = firebase.firestore().collection("students1").doc(user.uid);
  let welcomeText = document.getElementById('hello');

  // Load Profile
  studentRef.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("profileRegNo").value = data.regNo || "";
      document.getElementById("profileFullName").value = data.fullName || "";
      document.getElementById("profileEmail").value = data.email || "";
      document.getElementById("profilePhone").value = data.phone || "";
      document.getElementById("profileDept").value = data.department || "";
      document.getElementById("totalScore").innerHTML =  `<i class="bi bi-graph-up" style="font-size: 20px; "></i> ${data.totalScore.toFixed(2) || 0}`;
      document.getElementById("groupName").innerHTML = `<i class="bi bi-people" style="color: #800020; font-size:14px;"></i>  <b style="color: #800020; font-size:14px;">Soft Skill Group : ${data.groupId || ""}</b>`;
      document.getElementById("ssClassName").innerHTML = `<i class="bi bi-diagram-3" style="color: #800020; font-size:14px;"></i> <b style="color: #800020; font-size:14px;">Soft Skill Class : ${data.classId || ""}</b>`;
      welcomeText.innerHTML = `Hello, ${data.fullName}`;
      welcomeText.innerHTML = `Hello, ${data.fullName}`;
    }
  });

  // Update Profile
  document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const loader = document.getElementById("loader");
  const submitBtn = document.querySelector("#profileForm button[type='submit']");

  // Show loader + disable button
  loader.classList.add("active");
  submitBtn.disabled = true;
  submitBtn.innerText = "Updating...";

  studentRef.update({
    regNo: document.getElementById("profileRegNo").value,
    fullName: document.getElementById("profileFullName").value,
    email: document.getElementById("profileEmail").value,
    phone: document.getElementById("profilePhone").value,
    department: document.getElementById("profileDept").value
  })
  .then(() => {
    alert("✅ Profile updated!");
  })
  .catch((err) => {
    console.error("Error updating profile:", err);
    alert("❌ Error updating profile");
  })
  .finally(() => {
    // Hide loader + re-enable button
    loader.classList.remove("active");
    submitBtn.disabled = false;
    submitBtn.innerText = "Update Profile";
  });
});


  const studentId = user.uid; // use UID as document ID

  firebase.firestore().collection("students1").doc(studentId)
    .onSnapshot(doc => {
      if (doc.exists) {
        const s = doc.data();

        document.getElementById("scoreAttendance").textContent   = (s.attendance   || 0).toFixed(2);
        document.getElementById("scoreTest").textContent         = (s.test         || 0).toFixed(2);
        document.getElementById("scoreAssignment").textContent   = (s.assignment   || 0).toFixed(2);
        document.getElementById("scoreSoftSkill").textContent    = (s.softSkill    || 0).toFixed(2);
        document.getElementById("scoreFinalProject").textContent = (s.finalProject || 0).toFixed(2);
      } else {
        console.log("No score data found for this student.");
      }
  });

  
  studentRef.get().then(doc => {
    if (doc.exists) {
      const groupId = doc.data().groupId;
      if (groupId) {
        firebase.firestore().collection("students1")
          .where("groupId", "==", groupId)
          .get()
          .then(snaps => {
            const tableBody = document.getElementById("groupList");
            tableBody.innerHTML = ""; // clear old rows

            snaps.forEach(m => {
              if (m.id !== user.uid) { // exclude self
                const data = m.data();
                const row = document.createElement("tr");

                row.innerHTML = `
                  <td>${data.regNo || ""}</td>
                  <td>${data.fullName || ""}</td>
                  <td>${data.department || ""}</td>
                  <td>${data.phone || ""}</td>
                `;

                tableBody.appendChild(row);
              }
            });
          });
      }
    }
  })
  });


  // Load Group Members
//   studentRef.get().then(doc => {
//     if (doc.exists) {
//       const groupId = doc.data().groupId;
//       if (groupId) {
//         firebase.firestore().collection("students1").where("groupId", "==", groupId).get().then(snaps => {
//           const list = document.getElementById("groupList");
//           list.innerHTML = "";
//           snaps.forEach(m => {
//             if (m.id !== user.uid) { // exclude self
//               const li = document.createElement("li");
//               li.textContent = `${m.data().regNo} - ${m.data().fullName} ${m.data().department}`;
//               list.appendChild(li);
//             }
//           });
//         });
//       }
//     }
//   });
// });

function logOut() {
  // Show loader
  document.getElementById("loader").style.display = "flex";

  firebase.auth().signOut()
    .then(() => {
      alert("✅ Logged out successfully!");
      window.location.href = "index.html"; // redirect to login page
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("❌ Error logging out. Please try again.");
    })
    .finally(() => {
      // Hide loader after operation
      document.getElementById("loader").style.display = "none";
    });
}
