const DB_NAME = 'reviewflow-local-files'
const STORE_NAME = 'videos'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local video storage.'))
  })
}

export async function saveLocalVideo(id: string, file: File): Promise<void> {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(file, id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the video.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not save the video.'))
    })
  } finally {
    db.close()
  }
}

export async function getLocalVideo(id: string): Promise<Blob | null> {
  const db = await openDatabase()

  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
      request.onsuccess = () => {
        const value = request.result
        resolve(value instanceof Blob ? value : null)
      }
      request.onerror = () => reject(request.error ?? new Error('Could not load the video.'))
    })
  } finally {
    db.close()
  }
}

export async function deleteLocalVideo(id: string): Promise<void> {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete the video.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not delete the video.'))
    })
  } finally {
    db.close()
  }
}
