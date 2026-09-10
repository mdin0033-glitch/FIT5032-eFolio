<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-sm-10 offset-sm-1 col-md-8 offset-md-2">

        <h1 class="text-center">W5. Library Registration Form</h1>
        <p class="text-center">
          Let's build some more advanced features into our form.
        </p>

        <form @submit.prevent="submitForm">

          <!-- Username + Gender -->
          <div class="row mb-3">

            <div class="col-sm-6">
              <label for="username" class="form-label">
                Username
              </label>

              <input
                type="text"
                id="username"
                class="form-control"
                v-model="formData.username"
                @blur="validateName(true)"
                @input="validateName(false)"
              />

              <div
                v-if="errors.username"
                class="text-danger"
              >
                {{ errors.username }}
              </div>
            </div>

            <div class="col-sm-6">
              <label for="gender" class="form-label">
                Gender
              </label>

              <select
                id="gender"
                class="form-select"
                v-model="formData.gender"
                @blur="validateGender(true)"
                @change="validateGender(false)"
              >
                <option value="">Please select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <div
                v-if="errors.gender"
                class="text-danger"
              >
                {{ errors.gender }}
              </div>
            </div>

          </div>

          <!-- Password + Confirm Password -->
          <div class="row mb-3">

            <div class="col-sm-6">
              <label for="password" class="form-label">
                Password
              </label>

              <input
                type="password"
                id="password"
                class="form-control"
                v-model="formData.password"
                @blur="validatePassword(true)"
                @input="validatePassword(false)"
              />

              <div
                v-if="errors.password"
                class="text-danger"
              >
                {{ errors.password }}
              </div>
            </div>

            <div class="col-sm-6">
              <label for="confirm-password" class="form-label">
                Confirm password
              </label>

              <input
                type="password"
                id="confirm-password"
                class="form-control"
                v-model="formData.confirmPassword"
                @blur="validateConfirmPassword(true)"
              />

              <div
                v-if="errors.confirmPassword"
                class="text-danger"
              >
                {{ errors.confirmPassword }}
              </div>
            </div>

          </div>

          <!-- Australian Resident -->
          <div class="mb-3">
            <div class="form-check">

              <input
                type="checkbox"
                id="isAustralian"
                class="form-check-input"
                v-model="formData.isAustralian"
              />

              <label
                for="isAustralian"
                class="form-check-label"
              >
                Australian Resident?
              </label>

            </div>
          </div>

          <!-- Reason -->
          <div class="mb-3">

            <label for="reason" class="form-label">
              Reason for joining
            </label>

            <textarea
              id="reason"
              class="form-control"
              rows="3"
              v-model="formData.reason"
              @blur="validateReason(true)"
              @input="validateReason(false)"
            ></textarea>

            <div
              v-if="errors.reason"
              class="text-danger"
            >
              {{ errors.reason }}
            </div>

            <div
              v-if="friendMessage"
              class="text-success"
            >
              Great to have a friend
            </div>

          </div>

          <!-- Buttons -->
          <div class="text-center">

            <button
              type="submit"
              class="btn btn-primary me-2"
            >
              Submit
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              @click="clearForm"
            >
              Clear
            </button>

          </div>

        </form>

      </div>
    </div>

    <!-- PrimeVue DataTable -->
    <div
      class="row mt-5"
      v-if="submittedUsers.length"
    >
      <div class="col-12">

        <h5>This is a PrimeVue DataTable.</h5>

        <DataTable
          :value="submittedUsers"
          tableStyle="min-width: 50rem"
        >

          <Column
            field="username"
            header="Username"
          />

          <Column
            field="password"
            header="Password"
          />

          <Column header="Australian Resident">
            <template #body="slotProps">
              {{ slotProps.data.isAustralian ? 'true' : 'false' }}
            </template>
          </Column>

          <Column
            field="gender"
            header="Gender"
          />

          <Column
            field="reason"
            header="Reason"
          />

        </DataTable>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  isAustralian: false,
  reason: '',
  gender: ''
})

const submittedUsers = ref([])

const errors = ref({
  username: null,
  password: null,
  confirmPassword: null,
  resident: null,
  gender: null,
  reason: null
})

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) {
      errors.value.username =
        'Name must be at least 3 characters'
    }
  } else {
    errors.value.username = null
  }
}

const validatePassword = (blur) => {
  const password = formData.value.password
  const minLength = 8

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar =
    /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    if (blur) {
      errors.value.password =
        `Password must be at least ${minLength} characters long.`
    }
  } else if (!hasUppercase) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one uppercase letter.'
    }
  } else if (!hasLowercase) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one lowercase letter.'
    }
  } else if (!hasNumber) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one number.'
    }
  } else if (!hasSpecialChar) {
    if (blur) {
      errors.value.password =
        'Password must contain at least one special character.'
    }
  } else {
    errors.value.password = null
  }
}

const validateConfirmPassword = (blur) => {
  if (
    formData.value.password !==
    formData.value.confirmPassword
  ) {
    if (blur) {
      errors.value.confirmPassword =
        'Passwords do not match.'
    }
  } else {
    errors.value.confirmPassword = null
  }
}

const validateGender = (blur) => {
  if (!formData.value.gender) {
    if (blur) {
      errors.value.gender =
        'Please select a gender.'
    }
  } else {
    errors.value.gender = null
  }
}

const validateReason = (blur) => {
  if (formData.value.reason.length < 5) {
    if (blur) {
      errors.value.reason =
        'Reason must be at least 5 characters.'
    }
  } else {
    errors.value.reason = null
  }
}

const friendMessage = computed(() => {
  return formData.value.reason
    .toLowerCase()
    .includes('friend')
})

const submitForm = () => {
  validateName(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateGender(true)
  validateReason(true)

  if (
    !errors.value.username &&
    !errors.value.password &&
    !errors.value.confirmPassword &&
    !errors.value.gender &&
    !errors.value.reason
  ) {
    submittedUsers.value.push({
      ...formData.value
    })

    clearForm()
  }
}

const clearForm = () => {
  formData.value = {
    username: '',
    password: '',
    confirmPassword: '',
    isAustralian: false,
    reason: '',
    gender: ''
  }

  errors.value = {
    username: null,
    password: null,
    confirmPassword: null,
    resident: null,
    gender: null,
    reason: null
  }
}
</script>

<style scoped>
.text-danger {
  font-size: 0.875rem;
  margin-top: 4px;
}

.text-success {
  font-size: 0.875rem;
  margin-top: 4px;
}
</style>