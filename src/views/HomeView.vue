<template>
  <div class="container mt-5">

    <!-- User Information -->
    <div class="text-center">
      <h2>Welcome</h2>

      <div v-if="currentUser">
        <p>
          Logged in as:
          <strong>{{ currentUser.username }}</strong>
        </p>

        <p>
          Role:
          <strong>{{ currentUser.role }}</strong>
        </p>

        <router-link
          v-if="currentUser.role === 'admin'"
          to="/admin"
          class="btn btn-primary me-2"
        >
          Admin Dashboard
        </router-link>

        <button
          class="btn btn-danger"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </div>

    <hr class="my-5" />

    <!-- Rating Section -->
    <div class="row justify-content-center">
      <div class="col-md-7">

        <h3 class="text-center mb-4">
          User Reviews
        </h3>

        <!-- Average Rating -->
        <div class="text-center mb-4">
          <h4>
            Average Rating:
            {{ averageRating }} / 5
          </h4>

          <p>
            Total Reviews:
            {{ reviews.length }}
          </p>
        </div>

        <!-- Rating Form -->
        <form @submit.prevent="submitReview">

          <div class="mb-3">
            <label class="form-label">
              Rating
            </label>

            <select
              v-model="rating"
              class="form-select"
            >
              <option value="">
                Please select
              </option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">
              Review
            </label>

            <textarea
              v-model="reviewText"
              class="form-control"
              rows="3"
              placeholder="Write your review"
            ></textarea>
          </div>

          <div
            v-if="message"
            class="alert alert-danger"
          >
            {{ message }}
          </div>

          <button
            type="submit"
            class="btn btn-success w-100"
          >
            Submit Review
          </button>

        </form>

        <!-- Reviews -->
        <div
          v-if="reviews.length"
          class="mt-5"
        >
          <h4>Reviews</h4>

          <div
            v-for="(review, index) in reviews"
            :key="index"
            class="card mb-3"
          >
            <div class="card-body">

              <h5 class="card-title">
                {{ review.username }}
              </h5>

              <p>
                <strong>
                  Rating: {{ review.rating }} / 5
                </strong>
              </p>

              <p class="card-text">
                {{ review.comment }}
              </p>

            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentUser = ref(
  JSON.parse(
    localStorage.getItem('currentUser')
  )
)

const rating = ref('')
const reviewText = ref('')
const message = ref('')

const reviews = ref(
  JSON.parse(
    localStorage.getItem('reviews')
  ) || []
)

const averageRating = computed(() => {
  if (reviews.value.length === 0) {
    return '0.0'
  }

  const total = reviews.value.reduce(
    (sum, review) => {
      return sum + Number(review.rating)
    },
    0
  )

  return (
    total / reviews.value.length
  ).toFixed(1)
})

const submitReview = () => {

  if (!rating.value) {
    message.value = 'Please select a rating.'
    return
  }

  if (reviewText.value.trim().length < 3) {
    message.value =
      'Review must be at least 3 characters.'
    return
  }

  const newReview = {
    username: currentUser.value.username,
    rating: Number(rating.value),
    comment: reviewText.value.trim()
  }

  reviews.value.push(newReview)

  localStorage.setItem(
    'reviews',
    JSON.stringify(reviews.value)
  )

  rating.value = ''
  reviewText.value = ''
  message.value = ''
}

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/login')
}
</script>