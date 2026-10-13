<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <h1 class="mb-4">Add a Book</h1>

        <form class="card card-body mb-5" @submit.prevent="addBook">
          <div class="mb-3">
            <label for="isbn" class="form-label">ISBN</label>
            <input
              id="isbn"
              v-model="isbn"
              type="number"
              class="form-control"
              required
            />
          </div>

          <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div v-if="message" :class="messageClass" role="alert">
            {{ message }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Adding...' : 'Add Book' }}
          </button>
        </form>

        <BookList ref="bookList" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { addDoc, collection } from 'firebase/firestore'
import db from '../firebase/init'
import BookList from '../components/BookList.vue'

const isbn = ref('')
const name = ref('')
const message = ref('')
const isError = ref(false)
const isSaving = ref(false)
const bookList = ref(null)

const messageClass = computed(() => [
  'alert',
  isError.value ? 'alert-danger' : 'alert-success'
])

const addBook = async () => {
  message.value = ''
  isError.value = false

  const numericIsbn = Number(isbn.value)
  const bookName = name.value.trim()

  if (!Number.isFinite(numericIsbn) || !bookName) {
    isError.value = true
    message.value = 'ISBN and name are required.'
    return
  }

  isSaving.value = true

  try {
    await addDoc(collection(db, 'books'), {
      isbn: numericIsbn,
      name: bookName
    })

    message.value = 'Book added successfully.'
    isbn.value = ''
    name.value = ''
    await bookList.value?.loadBooks()
  } catch (error) {
    console.error('Unable to add book:', error)
    isError.value = true
    message.value = `Unable to add book: ${error.message}`
  } finally {
    isSaving.value = false
  }
}
</script>
