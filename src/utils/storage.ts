// Local Storage utilities
export const storage = {
  // Get item from localStorage
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue || null
    }
  },

  // Set item in localStorage
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  },

  // Remove item from localStorage
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  },

  // Clear all localStorage
  clear: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  // Check if key exists
  has: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(key) !== null
  },

  // Get all keys
  keys: (): string[] => {
    if (typeof window === 'undefined') return []
    return Object.keys(window.localStorage)
  },

  // Get storage size in bytes
  size: (): number => {
    if (typeof window === 'undefined') return 0
    
    let total = 0
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        total += window.localStorage[key].length + key.length
      }
    }
    return total
  },
}

// Session Storage utilities
export const sessionStorage = {
  // Get item from sessionStorage
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return defaultValue || null
    }
  },

  // Set item in sessionStorage
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  },

  // Remove item from sessionStorage
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error)
    }
  },

  // Clear all sessionStorage
  clear: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing sessionStorage:', error)
    }
  },

  // Check if key exists
  has: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(key) !== null
  },
}

// IndexedDB utilities (for larger data)
export const indexedDB = {
  // Open database
  open: (name: string, version: number): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available'))
        return
      }

      const request = window.indexedDB.open(name, version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  },

  // Store data
  store: async (dbName: string, storeName: string, data: any, key?: string): Promise<void> => {
    const db = await indexedDB.open(dbName, 1)
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = key ? store.put(data, key) : store.add(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  // Retrieve data
  retrieve: async (dbName: string, storeName: string, key: string): Promise<any> => {
    const db = await indexedDB.open(dbName, 1)
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  // Delete data
  delete: async (dbName: string, storeName: string, key: string): Promise<void> => {
    const db = await indexedDB.open(dbName, 1)
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },
}

// Cache utilities
export const cache = {
  // Simple in-memory cache
  memory: new Map<string, { data: any; timestamp: number; ttl?: number }>(),

  // Set cache item
  set: (key: string, data: any, ttl?: number): void => {
    cache.memory.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  },

  // Get cache item
  get: <T>(key: string): T | null => {
    const item = cache.memory.get(key)
    if (!item) return null

    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      cache.memory.delete(key)
      return null
    }

    return item.data
  },

  // Delete cache item
  delete: (key: string): void => {
    cache.memory.delete(key)
  },

  // Clear all cache
  clear: (): void => {
    cache.memory.clear()
  },

  // Check if key exists and is not expired
  has: (key: string): boolean => {
    const item = cache.memory.get(key)
    if (!item) return false

    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      cache.memory.delete(key)
      return false
    }

    return true
  },
}

