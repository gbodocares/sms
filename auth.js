function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}




const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


const groups = ["Alpha", "Beta", "Charlie", "Delta", "Echo", "Fox", "Gamma", "Hive", "Intel", "Justice"];
const ssGroups = ["CLASS 1", "CLASS 2", "CLASS 3"];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

    let departmentSelect = document.getElementById("dept");
    let regNoSelect = document.getElementById("regNo");

    var studentsRegNo = {};

    // Fetch students from Firestore
    firebase.firestore().collection("new-pre-batch9-students").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        let data = doc.data();
        let department = data.course;
        let regNo = data.id;
        let name = data.surName + " " + data.firstName;

        let studentString = regNo + " - " + name;

        if (!studentsRegNo[department]) {
          studentsRegNo[department] = [];
        }
        studentsRegNo[department].push(studentString);
      });

      // Populate departments
      Object.keys(studentsRegNo).forEach(function(dept) {
        var option = document.createElement("option");
        option.value = dept;
        option.textContent = dept;
        departmentSelect.appendChild(option);
      });
    }).catch(function(error) {
      console.error("Error fetching students: ", error);
    });

    // Handle department change
    departmentSelect.addEventListener("change", function() {
      var selectedDept = this.value;
      regNoSelect.innerHTML = '<option value="">--Select Student--</option>';

      if (selectedDept && studentsRegNo[selectedDept]) {
        studentsRegNo[selectedDept].forEach(function(student) {
          var option = document.createElement("option");
          option.value = student.split(" - ")[0].trim(); // numeric part
          option.textContent = student; // full string
          regNoSelect.appendChild(option);
        });
      }
    });
  

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const regNo = document.getElementById("regNo").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const dept = document.getElementById("dept").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const photoFile = document.getElementById("profilePhoto").files[0];

  if (!photoFile) {
    return alert("Please select a profile photo");
  }

  // Show loader
  document.getElementById("loader").style.display = "flex";

  try {
    // 🔍 Check if regNo already exists
    const regNoSnap = await firebase.firestore()
      .collection("students1")
      .where("regNo", "==", regNo)
      .get();

    if (!regNoSnap.empty) {
      alert("This Registration Number has already been used. Please use your unique reg No. or See the Admin");
      return;
    }

    // Create user in Firebase Auth
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);

    // Upload photo to Firebase Storage
    const storageRef = firebase.storage().ref(`students1/${cred.user.uid}/profile.jpg`);
    await storageRef.put(photoFile);

    // Get download URL
    const photoURL = await storageRef.getDownloadURL();

    //🔹 Step 1: Assign Class (max 40 per class)
    const shuffledClasses = shuffle([...ssGroups]);
    let assignedClass = null;
    for (let c of shuffledClasses) {
      const snap = await firebase.firestore()
        .collection("students1")
        .where("classId", "==", c)
        .get();

      if (snap.size < 40) {
        assignedClass = c;
        break;
      }
    }
    if (!assignedClass) {
      alert("All Soft Skill classes are full! Cannot assign student.");
      return;
    }

    // Shuffle and assign group
    const shuffledGroups = shuffle([...groups]);
    let assignedGroup = null;
    for (let g of shuffledGroups) {
      const snap = await firebase.firestore().collection("students1").where("groupId", "==", g).get();
      if (snap.size < 17) {
        assignedGroup = g;
        break;
      }
    }

    if (!assignedGroup) {
      alert("All soft skill groups are full! Cannot assign student.");
      return;
    }

    // Save student data with assigned group
    await firebase.firestore().collection("students1").doc(cred.user.uid).set({
      regNo: regNo,
      fullName: fullName,
      email: email,
      department: dept,
      groupId: assignedGroup,
      classId: assignedClass,
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

    alert(`Successfully registered and assigned to the soft skill group and class: Group ${assignedGroup} and ${assignedClass}`);
    window.location.href = "student.html";
    registerForm.reset();

  } catch (err) {
    alert(err.message);
  } finally {
    // Always hide loader (success or error)
    document.getElementById("loader").style.display = "none";
  }
});




// Login (unchanged)
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Show loader
  document.getElementById("loader").style.display = "flex";

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(cred => {
      return firebase.firestore().collection("students1").doc(cred.user.uid).get();
    })
    .then(doc => {
      if (doc.exists) {
        window.location.href = "student.html";
      } else {
        alert("❌ You don't have a student account yet. Meet the Admin");
      }
    })
    .catch(err => {
      alert(err.message);
    })
    .finally(() => {
      // Always hide loader
      document.getElementById("loader").style.display = "none";
    });
});



