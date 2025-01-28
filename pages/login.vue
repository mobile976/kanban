<template>
  <div id="app">
    <!-- Header Section -->
    <header class="header">
  <nav class="nav">
    <div class="logo">
      <router-link to="/">Khanban Application</router-link>
    </div>
    <ul class="nav-center">
      <li><router-link to="/add-task">Add Task</router-link></li>
      <li><router-link to="/kanban-board">Dashboard</router-link></li>
      <li><router-link to="/remind-board">Reminders Tasks</router-link></li>
    </ul>
    <ul class="nav-right">
      <li v-if="!user"><router-link to="/signup">Sign Up</router-link></li>
      <li v-if="user">Welcome, {{ user.name }}</li>
      <li v-if="user"><button @click="logout">Logout</button></li>
    </ul>
  </nav>
</header>

    <!-- Main Content Section -->
    <main>
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
    </main>

    <!-- Footer Section -->
    <footer class="footer">
      <p>Web-based Task Management Application Development</p>
    </footer>
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
<style scoped src="@/assets/css/header.css"></style>
<style scoped src="@/assets/css/footer.css"></style>
<style scoped src="@/assets/css/main.css"></style>
<style scoped src="@/assets/css/general.css"></style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"></link>
