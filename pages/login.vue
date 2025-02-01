<template>
  <div>
    <div class="dashboard">
      <!-- Left Section -->
      <div class="left-section">
        <button @click="$router.push('/add-task')">Add Task</button>
        <button @click="$router.push('/')">Dashboard</button>
        <button @click="$router.push('/remind-board')">Remind Board</button>
        <br />
        <button @click="$router.push('/signup')">Sign up</button>
      </div>
      
      <!-- Right Section -->
      <div class="right-section">
        <div class="task-form">
          <h1>Login</h1>
          <form @submit.prevent="login">
            <div>
              <label for="email">Email:</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Enter your email"
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
                required
              />
            </div>
            <button type="submit" :disabled="isLoading">
              {{ isLoading ? "Logging in..." : "Login" }}
            </button>
          </form>
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
        email: "",
        password: "",
        isLoading: false,
        user: null,
      };
    },
    created() {
      auth.onAuthStateChanged((user) => {
        if (user) {
          this.user = { name: user.displayName || user.email };
          this.$router.push("/");  // Redirect to home after login
        }
      });
    },
    methods: {
      async login() {
        this.isLoading = true;
        try {
          await auth.signInWithEmailAndPassword(this.email, this.password);
          this.$router.push("/");  // Redirect to home after successful login
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            alert("No account found with this email. Please sign up.");
          } else if (error.code === "auth/wrong-password") {
            alert("Incorrect password. Please try again.");
          } else {
            alert("Login failed. Please check your credentials and try again.");
          }
        } finally {
          this.isLoading = false;
        }
      },
      logout() {
        auth.signOut().then(() => {
          this.user = null;
          this.$router.push("/login");
        });
      },
    },
  };
</script>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<style scoped src="@/assets/css/boarder.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>