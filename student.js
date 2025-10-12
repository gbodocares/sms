// ===========================
// 🔹 Student Panel JS
// ===========================

// Loader functions
function showLoader() { document.getElementById("loader").style.display = "flex"; }
function hideLoader() { document.getElementById("loader").style.display = "none"; }

// Restore cached info instantly (if available)
const cachedUID = localStorage.getItem("studentUID");
const cachedName = localStorage.getItem("studentName");
const cachedRegNo = localStorage.getItem("studentRegNo");

if (cachedUID) {
  const hello = document.getElementById("hello");
  if (hello) hello.innerHTML = `Hello, ${cachedName}`;
  document.getElementById("profileRegNo").value = cachedRegNo || "";
}

// ===========================
// 🔹 Auth state listener
// ===========================
firebase.auth().onAuthStateChanged(async (user) => {
  showLoader();

  if (!user) {
    hideLoader();
    alert("⚠️ Please login first!");
    window.location.href = "index.html";
    return;
  }

  try {
    const studentRef = firebase.firestore().collection("students1").doc(user.uid);

    // Wait for Firestore to be ready (prevents "record not found" on tab switch)
    let doc = await studentRef.get();
    let attempts = 0;
    while (!doc.exists && attempts < 5) {
      await new Promise(res => setTimeout(res, 500));
      doc = await studentRef.get();
      attempts++;
    }

    if (!doc.exists) {
      hideLoader();
      alert("❌ Student record not found. Contact Admin.");
      return;
    }

    const data = doc.data();
    const hello = document.getElementById("hello");

    // Cache info locally for faster reloads
    localStorage.setItem("studentUID", user.uid);
    localStorage.setItem("studentName", data.fullName);
    localStorage.setItem("studentRegNo", data.regNo);

    // 🔹 Fill Profile
    document.getElementById("profileRegNo").value = data.regNo || "";
    document.getElementById("profileFullName").value = data.fullName || "";
    document.getElementById("profileEmail").value = data.email || "";
    document.getElementById("profilePhone").value = data.phone || "";
    document.getElementById("profileDept").value = data.department || "";
    document.getElementById("totalScore").innerHTML = `<i class="bi bi-graph-up"></i> ${data.totalScore?.toFixed(2) || 0}`;
    document.getElementById("groupName").innerHTML = `<i class="bi bi-people"></i> <b>Soft Skill Group: ${data.groupId || ""}</b>`;
    document.getElementById("ssClassName").innerHTML = `<i class="bi bi-diagram-3"></i> <b>Soft Skill Class: ${data.classId || ""}</b>`;
    if (hello) hello.innerHTML = `Hello, ${data.fullName}`;

    // ===========================
    // 🔹 Profile Update
    // ===========================
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const loader = document.getElementById("loader");
        const submitBtn = profileForm.querySelector("button[type='submit']");

        loader.classList.add("active");
        submitBtn.disabled = true;
        submitBtn.innerText = "Updating...";

        try {
          await studentRef.update({
            regNo: document.getElementById("profileRegNo").value,
            fullName: document.getElementById("profileFullName").value,
            email: document.getElementById("profileEmail").value,
            phone: document.getElementById("profilePhone").value,
            department: document.getElementById("profileDept").value
          });
          alert("✅ Profile updated!");
        } catch (err) {
          console.error("Error updating profile:", err);
          alert("❌ Error updating profile");
        } finally {
          loader.classList.remove("active");
          submitBtn.disabled = false;
          submitBtn.innerText = "Update Profile";
        }
      });
    }

    // ===========================
    // 🔹 Real-time score updates
    // ===========================
    studentRef.onSnapshot(docSnap => {
      if (docSnap.exists) {
        const s = docSnap.data();
        document.getElementById("scoreAttendance").textContent   = (s.attendance   || 0).toFixed(2);
        document.getElementById("scoreTest").textContent         = (s.test         || 0).toFixed(2);
        document.getElementById("scoreAssignment").textContent   = (s.assignment   || 0).toFixed(2);
        document.getElementById("scoreSoftSkill").textContent    = (s.softSkill    || 0).toFixed(2);
        document.getElementById("scoreFinalProject").textContent = (s.finalProject || 0).toFixed(2);
      }
    });

    // ===========================
    // 🔹 Load Group Members
    // ===========================
    if (data.groupId) {
      const snaps = await firebase.firestore().collection("students1")
        .where("groupId", "==", data.groupId)
        .get();
      const tableBody = document.getElementById("groupList");
      tableBody.innerHTML = "";

      snaps.forEach(m => {
        if (m.id !== user.uid) {
          const d = m.data();
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${d.regNo || ""}</td>
            <td>${d.fullName || ""}</td>
            <td>${d.department || ""}</td>
            <td>${d.phone || ""}</td>
          `;
          tableBody.appendChild(row);
        }
      });
    }

    // ===========================
    // 🔹 Load Classmates Ranking
    // ===========================
    if (data.department) {
      const snaps = await firebase.firestore().collection("students1")
        .where("department", "==", data.department)
        .orderBy("totalScore", "desc")
        .get();

      const tableBody = document.getElementById("classmatesTable");
      const summaryBox = document.getElementById("rankingSummary");
      tableBody.innerHTML = "";

      let position = 1;
      let totalStudents = snaps.size;
      let currentRank = null;
      let currentTotalScore = null;

      snaps.forEach(docSnap => {
        const d = docSnap.data();
        const tr = document.createElement("tr");

        let color = "";
        let icon = "";
        if (position === 1) { color = "background-color: gold; font-weight: bold; color: #000;"; icon = "👑"; }
        else if (position === 2) { color = "background-color: silver; font-weight: bold; color: #000;"; icon = "🥈"; }
        else if (position === 3) { color = "background-color: #cd7f32; font-weight: bold; color: #fff;"; icon = "🏅"; }

        let highlight = "";
        if (docSnap.id === user.uid) {
          highlight = "background-color: #d4edda; font-weight: bold;";
          currentRank = position;
          currentTotalScore = d.totalScore || 0;
        }

        tr.innerHTML = `
          <td style="${color}">${position}</td>
          <td>${d.regNo || ""}</td>
          <td>${icon} ${d.fullName || ""}</td>
          <td>${(d.totalScore || 0).toFixed(2)}</td>
        `;
        tr.setAttribute("style", highlight);
        tableBody.appendChild(tr);
        position++;
      });

      if (currentRank) {
        summaryBox.innerHTML = `
          <div style="background:#f1f1f1; padding:15px; border-radius:10px; text-align:center; margin-bottom:15px;">
            <h3 style="color:#800020; font-weight:bold;">🎯 Your Class Ranking</h3>
            <p>You are currently <b>Ranked #${currentRank}</b> out of <b>${totalStudents}</b> students.</p>
            <p>Total Score: <b>${currentTotalScore.toFixed(2)}</b></p>
          </div>
        `;
      } else {
        summaryBox.innerHTML = `
          <div style="background:#ffeaea; padding:15px; border-radius:10px; text-align:center; color:#800;">
            <p>Ranking data not found. Please check with your instructor.</p>
          </div>
        `;
      }
    }

  } catch (err) {
    console.error("🔥 Error restoring session:", err);
    alert("⚠️ Could not restore session. Please refresh.");
  } finally {
    hideLoader();
  }
});

// ===========================
// 🔹 Logout function
// ===========================
function logOut() {
  showLoader();
  firebase.auth().signOut()
    .then(() => {
      localStorage.clear(); // clear cached data
      alert("✅ Logged out successfully!");
      window.location.href = "index.html";
    })
    .catch(err => {
      console.error("Logout error:", err);
      alert("❌ Error logging out. Please try again.");
    })
    .finally(() => {
      hideLoader();
    });
}
