import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import './App.css'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

function App() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState("")
  const [editItem, setEditItem] = useState({ id: null, name: "" })

  // Read - Fetch items from Firebase
  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "items"))
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setItems(itemsList)
    }
    fetchItems()
  }, [])

  // Create - Add new item
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newItem.trim() === "") return

    try {
      const docRef = await addDoc(collection(db, "items"), {
        name: newItem
      })
      setItems([...items, { id: docRef.id, name: newItem }])
      setNewItem("")
    } catch (error) {
      console.error("Error adding document: ", error)
    }
  }

  // Update - Edit existing item
  const handleUpdate = async (id) => {
    if (editItem.name.trim() === "") return

    try {
      const itemRef = doc(db, "items", id)
      await updateDoc(itemRef, {
        name: editItem.name
      })
      setItems(items.map(item => 
        item.id === id ? { ...item, name: editItem.name } : item
      ))
      setEditItem({ id: null, name: "" })
    } catch (error) {
      console.error("Error updating document: ", error)
    }
  }

  // Delete - Remove item
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "items", id))
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error("Error deleting document: ", error)
    }
  }

  return (
    <div className="container">
      <h1>Firebase CRUD App</h1>
      
      {/* Create */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
        />
        <button type="submit">Add Item</button>
      </form>

      {/* Read & Update & Delete */}
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {editItem.id === item.id ? (
              <div>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
                <button onClick={() => handleUpdate(item.id)}>Save</button>
                <button onClick={() => setEditItem({ id: null, name: "" })}>Cancel</button>
              </div>
            ) : (
              <div>
                {item.name}
                <button onClick={() => setEditItem({ id: item.id, name: item.name })}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
