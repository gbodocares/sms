function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}




const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


const groups = ["Alpha", "Beta", "Charlie", "Delta", "Echo", "Fox", "Gamma", "Hive", "Intel", "Justice"];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}


    // const studentsRegNo = {
    //   "Tailoring": [
    //     "284 - IGWE NKIRU", "777 - OLADELE OMOTOLA", "248 - DAVID MIRACLE", 
    //     "454 - LAWAL MAZEEDAH", "472 - IGBEBINA SAMSON", "206 - MUNTEKIYAT MURITALA",
    //     "442 - NNADI CHIDINMA", "964 - UMAR RAFAT", "773 - IDRIS PELUMI", 
    //     "327 - JIMOH KHALIDAT", "386 - IZUGBUNAM ADANNA", "381 - ODEYEMI JESSE", 
    //     "799 - YUSUF ASMAU", "112 - AKINDE TITLAYO", "517 - IBRAHIM WOSILAT", 
    //     "718 - IDRIS OMOLARA", "985 - OLOJEDE ZAINAB", "307 - ONYEJEKWE JULIET"
    //   ],

    //   "Make-up": [
    //     "760 - ASQUO BASSEY EDISUA", "541 - UDEEGWU CLAUDIA", 
    //     "626 - MICHEAL FAVOUR", "015 - OYENIYI HAJARAT",
    //     "065 - ABUBAKAR MERCY"
    //   ],

    //   "Nails Technology": [
    //     "710 - UNEGBU PANELA", "135 - ALADE OLUWAPELUMI", "512 - ADEWOLE FATIA", "470 - OSOFISAN AYOBAMI", 
    //     "444 - OLADEJO AYOMIDE", "909 - IYANDA MARIAM", "808 - OLOWU ADERONKE", "008 - OGUNGBEMI OLUWABUKOLA", 
    //     "500 - OLUWATUYI AYOMIDE", "743 - PAM DORCAS", "581 - NDUBUAKWU RAPHAEL", "527 - AMONILOJU FAREEDAH", 
    //     "054 - GADE VICTORIA", "458 - ISHOLA BOLUWATIFE", "667 - OSHO OMOGBONJUBOLA", "747 - SAMUEL ESTHER", 
    //     "786 - DAVID PROSPER", "535 - AHMED TAOFEEKAT", "342 - BARUWA SAMIAT", "786 - UDOCHI JOY", "847 - OSENI ALIYAH"
    //   ],

    //   "Videography & Photography": [
    //     "989 - OGUNJIMI ELIJAH", "685 - BERNARD EZEKIEL", "770 - SOSANYA KHADIJAT", "804 - OKO EMMANUEL", "886 - BELLO FRIDAUS", "368 - KAWOJUE FAWAZ", "942 - SULAIMON MARIAM", "798 - BERNAD VICTOR",
    //     "", "", "", "","", "", "", "",
    //   ],

    //   "Video Editing": [
    //     "", "", "", "","", "", "", "",
    //     "", "", "", "","", "", "", "",
    //   ],

    //   "Computer Networking": [
    //     "", "", "", "","", "", "", "",
    //     "", "", "", "","", "", "", "",
    //   ],

    //   "Web Design": [
    //     "", "", "", "","", "", "", "",
    //     "", "", "", "","", "", "", "",
    //   ],

    //   "UI/UX Design": [
    //     "", "", "", "","", "", "", "",
    //     "", "", "", "","", "", "", "",
    //   ],

    // }; 
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
      alert("This Registration Number has already been used. Please use your unique reg No.");
      return;
    }

    // Create user in Firebase Auth
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);

    // Upload photo to Firebase Storage
    const storageRef = firebase.storage().ref(`students1/${cred.user.uid}/profile.jpg`);
    await storageRef.put(photoFile);

    // Get download URL
    const photoURL = await storageRef.getDownloadURL();

    // Shuffle and assign group
    const shuffledGroups = shuffle([...groups]);
    let assignedGroup = null;
    for (let g of shuffledGroups) {
      const snap = await firebase.firestore().collection("students1").where("groupId", "==", g).get();
      if (snap.size < 10) {
        assignedGroup = g;
        break;
      }
    }

    if (!assignedGroup) {
      alert("All groups are full! Cannot assign student.");
      return;
    }

    // Save student data with assigned group
    await firebase.firestore().collection("students1").doc(cred.user.uid).set({
      regNo: regNo,
      fullName: fullName,
      email: email,
      department: dept,
      groupId: assignedGroup,
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

    alert(`Successfully registered and assigned to the soft skill group: ${assignedGroup}`);
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



