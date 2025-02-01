<template>
  <div>
    <div>
      <div class="dashboard">
        <!-- Left Section -->
        <div class="left-section">
          <button @click="$router.push('/add-task')">Add Task</button>
          <button @click="$router.push('/')">Dashboard</button>
          <button @click="$router.push('/remind-board')">Remind Board</button>
          <br />
          <button @click="$router.push('/login')">Login</button>
        </div>

        <!-- Right Section -->
        <div class="right-section">
          <div class="task-form">
            <h1>Sign Up</h1>
            <form @submit.prevent="signUp">
              <div>
                <label for="name">Name:</label>
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  placeholder="Enter your name"
                  aria-label="Name"
                  required
                />
              </div>
              <div>
                <label for="email">Email:</label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email"
                  required
                />
              </div>
              <div>
                <label for="password">Password:</label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  placeholder="Enter your password"
                  aria-label="Password"
                  required
                />
              </div>
              <button type="submit" :disabled="loading">
                {{ loading ? "Signing Up..." : "Sign Up" }}
              </button>
              <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
              <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { auth } from "~/plugins/firebase";

export default {
  data() {
    return {
      name: "",
      email: "",
      password: "",
      errorMessage: "",
      successMessage: "",
      loading: false,
      user: null,
    };
  },
  created() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = { name: user.displayName || user.email };
        this.$router.push("/");  // Redirect to home after successful sign-up
      }
    });
  },
  methods: {
    async signUp() {
      if (!this.name.trim()) {
        this.errorMessage = "Name is required.";
        return;
      }

      this.errorMessage = "";
      this.successMessage = "";
      this.loading = true;

      try {
        // Create the user
        const userCredential = await auth.createUserWithEmailAndPassword(this.email, this.password);
        const user = userCredential.user;

        // Update the user's display name
        await user.updateProfile({
          displayName: this.name,
        });

        // Success message
        this.successMessage = "Sign-up successful! Redirecting to login...";

        // Clear form fields
        this.email = "";
        this.password = "";
        this.name = "";

        // Optionally redirect to the login page after 2 seconds
        setTimeout(() => {
          this.$router.push("/login");
        }, 2000);
      } catch (error) {
        this.handleError(error);
      } finally {
        this.loading = false;
      }
    },
    handleError(error) {
      if (error.code === "auth/email-already-in-use") {
        this.errorMessage = "This email is already in use.";
      } else if (error.code === "auth/weak-password") {
        this.errorMessage = "Password must be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        this.errorMessage = "Invalid email format.";
      } else {
        this.errorMessage = "Sign-up failed. Please try again.";
      }
      this.successMessage = "";
    },
    logout() {
      auth.signOut().then(() => {
        this.user = null;
        this.$router.push("/login");
      });
    }
  },
};
</script>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>