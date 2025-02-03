import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import Login from './components/Login'
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
const auth = getAuth(app)

function App() {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState("")
  const [editItem, setEditItem] = useState({ id: null, name: "" })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (user) {
        fetchItems()
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchItems = async () => {
    const querySnapshot = await getDocs(collection(db, "items"))
    const itemsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setItems(itemsList)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setItems([])
    } catch (error) {
      console.error("Error signing out: ", error)
    }
  }

  // Create - Add new item
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newItem.trim() === "") return

    try {
      const docRef = await addDoc(collection(db, "items"), {
        name: newItem,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString()
      })
      setItems([...items, { 
        id: docRef.id, 
        name: newItem,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString()
      }])
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
        name: editItem.name,
        dateUpdated: new Date().toISOString()
      })
      setItems(items.map(item => 
        item.id === id ? { 
          ...item, 
          name: editItem.name,
          dateUpdated: new Date().toISOString()
        } : item
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

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (!user) {
    return <Login onLogin={() => fetchItems()} />
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Firebase CRUD App</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
      
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
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Date Added</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                {editItem.id === item.id ? (
                  <input
                    type="text"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  />
                ) : (
                  item.name
                )}
              </td>
              <td>{formatDate(item.dateAdded)}</td>
              <td>{formatDate(item.dateUpdated)}</td>
              <td>
                {editItem.id === item.id ? (
                  <>
                    <button onClick={() => handleUpdate(item.id)}>Save</button>
                    <button onClick={() => setEditItem({ id: null, name: "" })}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditItem({ id: item.id, name: item.name })}>Edit</button>
                    <button onClick={() => handleDelete(item.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
