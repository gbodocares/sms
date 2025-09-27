 document.getElementById("forgotPasswordForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("resetEmail").value;
      const msg = document.getElementById("message");

      firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
          msg.textContent = "✅ Password reset link sent! Check your email.";
          msg.className = "message success";
        })
        .catch((err) => {
          msg.textContent = "❌ " + err.message;
          msg.className = "message error";
        });
    });