import { useState ,useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Split from "react-split"
import { addDoc, onSnapshot, doc, deleteDoc, setDoc } from "firebase/firestore"
import { db, notesCollection } from "./firebase-config"


// (notes[0] && notes[0].id) old code
// () => JSON.parse(localStorage.getItem("notes")) || []

export default function App() {
    const [notes, setNotes] = useState([])
    const [currentNoteId, setCurrentNoteId] = useState("")

    const currentNote = notes.find(note =>  note.id === currentNoteId) || notes[0]

    const [tempNoteText, setTempNoteText] = useState("")

    const sortedNotes = notes.sort((a, b) => b.updatedOn - a.updatedOn)
    
    // Moving from localStorage to Firebase now

    useEffect(() => {
        // localStorage.setItem("notes", JSON.stringify(notes))
            //cleanup code
        const unSubscribed = onSnapshot(notesCollection, //adding a callback
          function(snapshot){
                //setting up connection with firebase and syncing local data 
                const notesArray = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    //create an id for our local notes from firebase

                    id: doc.id
                }))
                setNotes(notesArray)
           } 
            )
            return unSubscribed //cleans up onSnapshot
    }, []) //no dependency

    useEffect(() => {
        if(!currentNoteId) {
            setCurrentNoteId(notes[0]?.id)
        }
    })

    useEffect(() => {
        if(currentNote){
            setTempNoteText(currentNote.body)
        }
    }, [currentNote])

    //Debouncing Logic for delayed requests

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            if(tempNoteText !== currentNote.body){

                updateNote(tempNoteText)
            }
        }, 500)

        return () => clearTimeout(timeOutId)
    }, [tempNoteText])
    
    async function createNewNote() {
        const newNote = {
            body: "# Type your note's title here",
            createdOn: Date.now(),
            updatedOn: Date.now()
        }
        // setNotes(prevNotes => [newNote, ...prevNotes])
        const newNoteRef = await addDoc(notesCollection, newNote)
        setCurrentNoteId(newNoteRef.id)
    }
    
    async function updateNote(text) {
        const docRef = doc(db, "notes", currentNoteId)
        await setDoc(docRef, {body : text, updatedOn: Date.now()}, {merge: true})
    }
    
    async function deleteNote( noteId) {
       const docRef = doc(db, "notes", noteId)
       await deleteDoc(docRef)
    }


    return (
        <main>
        {
            notes.length > 0 
            ?
            <Split 
                sizes={[20, 80]} 
                direction="horizontal" 
                className="split"
            >
                <Sidebar
                    notes={sortedNotes}
                    currentNote={currentNote}
                    setCurrentNoteId={setCurrentNoteId}
                    newNote={createNewNote}
                    deleteNote={deleteNote}
                />
                {
                    <Editor 
                        tempNoteText={tempNoteText} 
                        setTempNoteText={setTempNoteText} 
                    />
                }
            </Split>
            :
            <div className="no-notes">
                <h1>You have no notes</h1>
                <button 
                    className="first-note" 
                    onClick={createNewNote}
                >
                    Create one now
                </button>
            </div>
            
        }
        </main>
    )
}
