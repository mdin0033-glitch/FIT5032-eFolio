<template>
  <div class="container mt-5 text-center">
    <h2>Admin Dashboard</h2>

    <p class="mt-3">
      Welcome, Administrator.
    </p>

    <p>
      This page can only be accessed by users with the admin role.
    </p>

    <router-link
      to="/home"
      class="btn btn-primary"
    >
      Back to Home
    </router-link>
  </div>
</template>