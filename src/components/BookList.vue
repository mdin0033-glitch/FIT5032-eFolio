<template>
  <section>
    <h2 class="mb-3">Books with ISBN &gt; 1000</h2>
    <p class="text-muted">Ordered by ISBN and limited to 10 results.</p>

    <div v-if="isLoading" class="alert alert-info">Loading books...</div>
    <div v-else-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>
    <div v-else-if="books.length === 0" class="alert alert-secondary">
      No matching books found.
    </div>

    <div v-for="book in books" :key="book.id" class="card mb-3">
      <div class="card-body">
        <p class="card-text mb-3">
          <strong>{{ book.name }}</strong> (ISBN: {{ book.isbn }})
        </p>

        <label :for="`book-name-${book.id}`" class="form-label">
          Update name
        </label>
        <div class="input-group">
          <input
            :id="`book-name-${book.id}`"
            v-model="book.editName"
            type="text"
            class="form-control"
          />
          <button class="btn btn-outline-primary" @click="updateBook(book)">
            Update
          </button>
          <button class="btn btn-outline-danger" @click="removeBook(book.id)">
            Delete
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'
import db from '../firebase/init'

const books = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const loadBooks = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const booksQuery = query(
      collection(db, 'books'),
      where('isbn', '>', 1000),
      orderBy('isbn'),
      limit(10)
    )

    const snapshot = await getDocs(booksQuery)
    books.value = snapshot.docs.map((bookDocument) => ({
      id: bookDocument.id,
      ...bookDocument.data(),
      editName: bookDocument.data().name
    }))
  } catch (error) {
    console.error('Unable to retrieve books:', error)
    errorMessage.value = `Unable to retrieve books: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

const updateBook = async (book) => {
  const updatedName = book.editName.trim()

  if (!updatedName) {
    errorMessage.value = 'Book name is required.'
    return
  }

  try {
    await updateDoc(doc(db, 'books', book.id), {
      name: updatedName
    })
    await loadBooks()
  } catch (error) {
    console.error('Unable to update book:', error)
    errorMessage.value = `Unable to update book: ${error.message}`
  }
}

const removeBook = async (bookId) => {
  try {
    await deleteDoc(doc(db, 'books', bookId))
    await loadBooks()
  } catch (error) {
    console.error('Unable to delete book:', error)
    errorMessage.value = `Unable to delete book: ${error.message}`
  }
}

onMounted(loadBooks)

defineExpose({ loadBooks })
</script>
