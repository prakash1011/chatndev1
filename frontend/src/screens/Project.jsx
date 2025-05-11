// import React, { useState, useEffect, useContext, useRef } from 'react'
// import { UserContext } from '../context/user.context'
// import { useNavigate, useLocation } from 'react-router-dom'
// import axios from '../config/axios'
// import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
// import Markdown from 'markdown-to-jsx'
// import hljs from 'highlight.js';
// import { getWebContainer } from '../config/webcontainer'


// function SyntaxHighlightedCode(props) {
//     const ref = useRef(null)

//     React.useEffect(() => {
//         if (ref.current && props.className?.includes('lang-') && window.hljs) {
//             window.hljs.highlightElement(ref.current)

//             // hljs won't reprocess the element unless this attribute is removed
//             ref.current.removeAttribute('data-highlighted')
//         }
//     }, [ props.className, props.children ])

//     return <code {...props} ref={ref} />
// }


// const Project = () => {
//     const location = useLocation()
//     const navigate = useNavigate()

//     const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
//     const [ isModalOpen, setIsModalOpen ] = useState(false)
//     const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
//     const [ project, setProject ] = useState(location.state.project)
//     const [ message, setMessage ] = useState('')
//     const { user, setUser } = useContext(UserContext)
//     const messageBox = React.createRef()
//     const [ welcomeVisible, setWelcomeVisible ] = useState(false)
//     const [ isDeletingFile, setIsDeletingFile ] = useState(false)

//     const [ users, setUsers ] = useState([])
//     const [ messages, setMessages ] = useState([]) // New state variable for messages
//     const [ fileTree, setFileTree ] = useState({})

//     const [ currentFile, setCurrentFile ] = useState(null)
//     const [ openFiles, setOpenFiles ] = useState([])

//     const [ webContainer, setWebContainer ] = useState(null)
//     const [ iframeUrl, setIframeUrl ] = useState(null)

//     const [ runProcess, setRunProcess ] = useState(null)

//     const handleUserClick = (id) => {
//         setSelectedUserId(prevSelectedUserId => {
//             const newSelectedUserId = new Set(prevSelectedUserId);
//             if (newSelectedUserId.has(id)) {
//                 newSelectedUserId.delete(id);
//             } else {
//                 newSelectedUserId.add(id);
//             }

//             return newSelectedUserId;
//         });


//     }


//     function addCollaborators() {

//         axios.put("/projects/add-user", {
//             projectId: location.state.project._id,
//             users: Array.from(selectedUserId)
//         }).then(res => {
//             console.log(res.data)
//             setIsModalOpen(false)

//         }).catch(err => {
//             console.log(err)
//         })

//     }

//     // Function to send a message - with validation to prevent empty messages
//     const send = async () => {
//         // Don't send empty messages
//         if (!message || message.trim() === '') {
//             return;
//         }
        
//         const messageContent = message.trim();
        
//         // Create message object
//         const messageObj = {
//             sender: user,
//             message: messageContent,
//             timestamp: new Date()
//         };
        
//         // Update UI immediately
//         setMessages(prevMessages => [...prevMessages, messageObj])
        
//         // Clear input field
//         setMessage("")
        
//         try {
//             // Save message to database
//             await axios.post('/api/messages', {
//                 projectId: project._id,
//                 message: messageContent
//             });
            
//             // Send to socket for real-time updates to other users
//             sendMessage('project-message', messageObj);
//         } catch (error) {
//             console.error('Error saving message:', error);
//         }
//     }    
//     // Handle Enter key press to send message
//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault(); // Prevent default to avoid new line in input
//             send();
//         }
//     }

//     function WriteAiMessage(message) {

//         const messageObject = JSON.parse(message)

//         return (
//             <div
//                 className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
//             >
//                 <Markdown
//                     children={messageObject.text}
//                     options={{
//                         overrides: {
//                             code: SyntaxHighlightedCode,
//                         },
//                     }}
//                 />
//             </div>)
//     }

//     // Logout function
//     const handleLogout = () => {
//         // Clear user data
//         setUser(null)
//         // Remove token from localStorage
//         localStorage.removeItem('token')
//         // Navigate to login page
//         navigate('/login')
//     }

//     // Welcome message animation effect - only runs once on mount
//     useEffect(() => {
//         // Show welcome message animation with delay
//         setTimeout(() => {
//             setWelcomeVisible(true)
            
//             // Hide welcome message after 2 seconds
//             setTimeout(() => {
//                 setWelcomeVisible(false)
//             }, 2000)
//         }, 300)
//     }, []); // Empty dependency array means this runs only once on mount
    
//     // Initialize web container first
//     useEffect(() => {
//         if (!webContainer) {
//             getWebContainer().then(container => {
//                 setWebContainer(container)
//                 console.log("container started")
                
//                 // Create directories for the project
//                 container.fs.mkdir('/project', { recursive: true })
                
//                 // Initialize package.json
//                 container.fs.writeFile('/project/package.json', `{
//   "name": "express-server",
//   "version": "1.0.0",
//   "description": "A basic Express.js server",
//   "main": "app.js",
//   "scripts": {
//     "start": "node app.js"
//   },
//   "dependencies": {
//     "express": "^4.18.2"
//   }
// }`)
//             })
//         }
//     }, [])

//     // Socket initialization and message handling effect
//     useEffect(() => {
//         // Initialize socket connection for this project
//         const socket = initializeSocket(project._id)
        
//         // Set up a message handler function that we can reference for removal
//         const handleProjectMessage = (data) => {
//             console.log('Message received:', data)
            
//             if (data.sender._id === 'ai') {
//                 console.log('AI message:', data.message)

//                 if (webContainer && data.message.fileTree) {
//                     try {
//                         // Mount files in the project directory
//                         webContainer.fs.mount('/project', data.message.fileTree)
                        
//                         // Install dependencies
//                         webContainer.spawn('npm', ['install'], {
//                             cwd: '/project'
//                         })
                        
//                         // Start the server
//                         const serverProcess = webContainer.spawn('npm', ['start'], {
//                             cwd: '/project'
//                         })
                        
//                         // Log server output
//                         serverProcess.stdout.on('data', (data) => {
//                             console.log('Server output:', data.toString())
//                         })
                        
//                         // Get the server URL
//                         webContainer.getURL().then(url => {
//                             setIframeUrl(url)
//                         })
//                     } catch (error) {
//                         console.error('Error mounting files:', error)
//                     }
//                 }

//                 if (data.message.fileTree) {
//                     setFileTree(data.message.fileTree || {})
//                 }
//                 // Update messages state once
//                 setMessages(prevMessages => [ ...prevMessages, data ])
//             } else {
//                 // Update messages state once for regular messages
//                 setMessages(prevMessages => [ ...prevMessages, data ])
//             }
//         }
        
//         // Register the message handler
//         receiveMessage('project-message', handleProjectMessage)
        
//         // Cleanup function to remove event listeners when component unmounts or dependencies change
//         return () => {
//             // Remove the event listener to prevent duplicate messages
//             if (socket) {
//                 socket.off('project-message', handleProjectMessage);
//                 console.log('Socket listener removed for project-message');
//             }
//         };
//     }, [project._id, webContainer]); // Re-run if project ID or webContainer changes
    
//     // Project and user data loading effect
//     useEffect(() => {
//         axios.get(`/projects/get-project/${location.state.project._id}`)
//             .then(res => {
//                 console.log(res.data.project)
//                 setProject(res.data.project)
//                 setFileTree(res.data.project.fileTree || {})
//             })
//             .catch(err => console.log(err));

//         axios.get('/users/all')
//             .then(res => {
//                 setUsers(res.data.users || res.data)
//             })
//             .catch(err => console.log(err));
//     }, [location.state.project._id]);
    
//     function saveFileTree(ft) {
//         axios.put('/projects/update-file-tree', {
//             projectId: project._id,
//             fileTree: ft
//         }).then(res => {
//             console.log(res.data)
//         }).catch(err => {
//             console.log(err)
//         })
//     }
    
//     // Handle file deletion
//     function deleteFile(filename, e) {
//         e.stopPropagation() // Prevent file selection when clicking delete
//         setIsDeletingFile(true)
        
//         // Create a new file tree without the deleted file
//         const newFileTree = { ...fileTree }
//         delete newFileTree[filename]
        
//         // Update file tree state
//         setFileTree(newFileTree)
        
//         // Update openFiles list - remove the deleted file
//         setOpenFiles(openFiles.filter(file => file !== filename))
        
//         // If current file is being deleted, set to null or another file
//         if (currentFile === filename) {
//             const remainingFiles = Object.keys(newFileTree)
//             setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
//         }
        
//         // Save the updated file tree to the server
//         saveFileTree(newFileTree)
//         setIsDeletingFile(false)
//     }


//     // Removed appendIncomingMessage and appendOutgoingMessage functions

//     function scrollToBottom() {
//         messageBox.current.scrollTop = messageBox.current.scrollHeight
//     }

//     return (
//         <main className='h-screen w-screen flex bg-gradient-to-br from-blue-50 to-indigo-100'>
//             {/* Animated welcome message */}
//             <div className={`fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center transform transition-all duration-700 ease-in-out z-50 ${welcomeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
//                 <p className="font-medium">You can message collaborators, ask questions to AI using @ai prompt and also run servers here</p>
//             </div>
            
//             <section className="left relative flex flex-col h-screen min-w-96 bg-white shadow-md">
//                 <header className='flex justify-between items-center p-4 px-5 w-full bg-white border-b border-gray-200 absolute z-10 top-0'>
//                     <button className='flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg' onClick={() => setIsModalOpen(true)}>
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                         </svg>
//                         <p>Add collaborator</p>
//                     </button>
//                     <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 rounded-full'>
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//                         </svg>
//                     </button>
//                 </header>
//                 <div className="conversation-area pt-16 pb-12 flex-grow flex flex-col h-full relative">
//                     <div
//                         ref={messageBox}
//                         className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide">
//                         {messages.map((msg, index) => (
//                             <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-3xl' : 'max-w-xs md:max-w-sm'} ${msg.sender._id == user._id.toString() ? 'ml-auto bg-blue-100 border-blue-200' : 'bg-white border-gray-200'}  message flex flex-col p-3 shadow-sm border w-fit rounded-lg`}>
//                                 <small className='text-gray-600 text-xs font-medium mb-1'>{msg.sender.email}</small>
//                                 <div className={`${msg.sender._id === 'ai' ? 'text-sm overflow-auto max-h-96' : 'text-base'}`}>
//                                     {msg.sender._id === 'ai' ?
//                                         WriteAiMessage(msg.message)
//                                         : <p className="text-gray-800">{msg.message}</p>}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>

//                     <div className="inputField w-full flex absolute bottom-0 p-2 bg-white border-t border-gray-200 shadow-md">
//                         <input
//                             value={message}
//                             onChange={(e) => setMessage(e.target.value)}
//                             onKeyDown={handleKeyPress}
//                             className='p-3 px-4 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-blue-500 flex-grow transition duration-200' 
//                             type="text" 
//                             placeholder='Type @ai to ask AI a question...' />
//                         <button
//                             onClick={send}
//                             className='px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition duration-200'>
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                             </svg>
//                         </button>
//                     </div>
//                 </div>
//                 <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-white absolute transition-all duration-300 shadow-lg ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 z-20`}>
//                     <header className='flex justify-between items-center px-5 py-4 bg-white border-b border-gray-200'>
//                         <h1 className='font-semibold text-xl text-gray-800'>Collaborators</h1>
//                         <button 
//                             onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
//                             className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition duration-200'
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </button>
//                     </header>
//                     <div className="users flex flex-col gap-3 p-4">
//                         {project.users && project.users.map((collaborator, index) => (
//                             <div key={index} className="user bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3 transition-colors duration-200">
//                                 <div className='aspect-square rounded-full w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600'>
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                                     </svg>
//                                 </div>
//                                 <div className="flex-grow">
//                                     <h1 className='font-medium text-gray-800'>{collaborator.email}</h1>
//                                 </div>
//                                 {/* Logout button only for the current user */}
//                                 {user && user._id === collaborator._id && (
//                                     <button 
//                                         onClick={handleLogout}
//                                         title="Logout"
//                                         className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                                         </svg>
//                                     </button>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>

//             <section className="right bg-white flex-grow h-full flex shadow-md">
//                 <div className="explorer h-full max-w-64 min-w-52 bg-gray-50 border-r border-gray-200">
//                     <div className="p-3 border-b border-gray-200 bg-white">
//                         <h2 className="text-gray-700 font-medium text-sm uppercase tracking-wider">Files</h2>
//                     </div>
//                     <div className="file-tree w-full overflow-y-auto">
//                         {Object.keys(fileTree).length === 0 ? (
//                             <div className="p-4 text-center text-gray-500">
//                                 <p>No files yet</p>
//                             </div>
//                         ) : (
//                             Object.keys(fileTree).map((file, index) => (
//                                 <div key={index} className="group relative tree-element hover:bg-gray-100 w-full transition-colors duration-150 border-b border-gray-100">
//                                     <button
//                                         onClick={() => {
//                                             setCurrentFile(file)
//                                             setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
//                                         }}
//                                         className="w-full p-3 flex items-center gap-2 text-left">
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                                         </svg>
//                                         <p className='font-medium text-gray-700 truncate'>{file}</p>
//                                     </button>
//                                     {/* Delete file button */}
//                                     <button
//                                         title="Delete file"
//                                         disabled={isDeletingFile}
//                                         onClick={(e) => deleteFile(file, e)}
//                                         className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all duration-200"
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                         </svg>
//                                     </button>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>


//                 <div className="code-editor flex flex-col flex-grow h-full shrink">
//                     <div className="top flex justify-between w-full bg-gray-50 border-b border-gray-200">
//                         <div className="files flex overflow-x-auto">
//                             {openFiles.length === 0 ? (
//                                 <div className="p-3 text-gray-500 text-sm">No open files</div>
//                             ) : (
//                                 openFiles.map((file, index) => (
//                                     <button
//                                         key={index}
//                                         onClick={() => setCurrentFile(file)}
//                                         className={`open-file cursor-pointer p-3 flex items-center w-fit gap-2 border-r border-gray-200 transition-colors duration-150 ${currentFile === file ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'hover:bg-gray-100 text-gray-700'}`}>
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                                         </svg>
//                                         <p className='font-medium text-sm'>{file}</p>
//                                     </button>
//                                 ))
//                             )}
//                         </div>

//                         <div className="actions flex gap-2 p-2">
//                             <button
//                                 onClick={async () => {
//                                     await webContainer.mount(fileTree)

//                                     const installProcess = await webContainer.spawn("npm", [ "install" ])

//                                     installProcess.output.pipeTo(new WritableStream({
//                                         write(chunk) {
//                                             console.log(chunk)
//                                         }
//                                     }))

//                                     if (runProcess) {
//                                         runProcess.kill()
//                                     }

//                                     let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

//                                     tempRunProcess.output.pipeTo(new WritableStream({
//                                         write(chunk) {
//                                             console.log(chunk)
//                                         }
//                                     }))

//                                     setRunProcess(tempRunProcess)

//                                     webContainer.on('server-ready', (port, url) => {
//                                         console.log(port, url)
//                                         setIframeUrl(url)
//                                     })
//                                 }}
//                                 className='py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium'
//                             >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                 </svg>
//                                 Run Server
//                             </button>
//                         </div>
//                     </div>
//                     <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
//                         {
//                             fileTree[ currentFile ] && (
//                                 <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
//                                     <pre
//                                         className="hljs h-full">
//                                         <code
//                                             className="hljs h-full outline-none"
//                                             contentEditable
//                                             suppressContentEditableWarning
//                                             onBlur={(e) => {
//                                                 const updatedContent = e.target.innerText;
//                                                 const ft = {
//                                                     ...fileTree,
//                                                     [ currentFile ]: {
//                                                         file: {
//                                                             contents: updatedContent
//                                                         }
//                                                     }
//                                                 }
//                                                 setFileTree(ft)
//                                                 saveFileTree(ft)
//                                             }}
//                                             dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
//                                             style={{
//                                                 whiteSpace: 'pre-wrap',
//                                                 paddingBottom: '25rem',
//                                                 counterSet: 'line-numbering',
//                                             }}
//                                         />
//                                     </pre>
//                                 </div>
//                             )
//                         }
//                     </div>

//                 </div>

//                 {iframeUrl && webContainer &&
//                     (<div className="flex min-w-96 flex-col h-full">
//                         <div className="address-bar">
//                             <input type="text"
//                                 onChange={(e) => setIframeUrl(e.target.value)}
//                                 value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
//                         </div>
//                         <iframe src={iframeUrl} className="w-full h-full"></iframe>
//                     </div>)
//                 }


//             </section>

//             {isModalOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//                     <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
//                         <header className='flex justify-between items-center mb-4'>
//                             <h2 className='text-xl font-semibold'>Select User</h2>
//                             <button onClick={() => setIsModalOpen(false)} className='p-2'>
//                                 <i className="ri-close-fill"></i>
//                             </button>
//                         </header>
//                         <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
//                             {users.map(user => (
//                                 <div key={user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
//                                     <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
//                                         <i className="ri-user-fill absolute"></i>
//                                     </div>
//                                     <h1 className='font-semibold text-lg'>{user.email}</h1>
//                                 </div>
//                             ))}
//                         </div>
//                         <button
//                             onClick={addCollaborators}
//                             className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
//                             Add Collaborators
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </main>
//     )
// }

// export default Project




import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user, setUser } = useContext(UserContext)
    const messageBox = React.createRef()
    const [ welcomeVisible, setWelcomeVisible ] = useState(false)
    const [ isDeletingFile, setIsDeletingFile ] = useState(false)

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    async function addCollaborators() {
        try {
            await axios.put("/projects/add-user", {
                projectId: location.state.project._id,
                users: Array.from(selectedUserId)
            });

            // Refresh project data to get updated collaborators
            const res = await axios.get(`/projects/get-project/${location.state.project._id}`);
            setProject(res.data.project);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error adding collaborators:', err);
        }
    }

    // Function to send a message - with validation, persistence and fallback mechanisms
    // Using useCallback to prevent recreation of this function on every render
    const send = useCallback(async () => {
        // Don't send empty messages
        if (!message || message.trim() === '') {
            return;
        }
        
        const messageContent = message.trim();
        
        try {
            // Update UI immediately for responsive feel
            const newMessage = { sender: user, message: messageContent, timestamp: new Date() };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            
            // Clear input field immediately
            setMessage("");
            
            // Send message to server via Socket.IO for real-time updates to other users
            sendMessage('project-message', {
                message: messageContent,
                sender: user
            });
            
            // Try to save message to database with fallback endpoints
            const endpoints = [
                { url: '/api/messages/save', method: 'post' },
                { url: '/api/messages', method: 'post' },
                { url: `/projects/${project._id}/messages`, method: 'post' }
            ];
            
            let savedSuccessfully = false;
            
            // Try each endpoint until successful or all fail
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to save message to endpoint: ${endpoint.url}`);
                    const res = await axios({
                        method: endpoint.method,
                        url: endpoint.url,
                        data: {
                            projectId: project._id,
                            message: messageContent
                        }
                    });
                    
                    if (res.status >= 200 && res.status < 300) {
                        console.log(`Successfully saved message to ${endpoint.url}`);
                        savedSuccessfully = true;
                        break;
                    }
                } catch (endpointErr) {
                    console.log(`Failed to save message to ${endpoint.url}:`, endpointErr.message);
                    // Continue to next endpoint
                }
            }
            
            if (!savedSuccessfully) {
                console.warn('Failed to save message to any endpoint. Message exists only in-memory and via Socket.IO.');
            }
            
            // Scroll to bottom to show new message
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Error in send function:', err);
        }
    }, [message, user, project._id]);
    
    // Function to save a message to the database
    const saveMessageToDatabase = useCallback(async (messageContent, messageSender) => {
        try {
            await axios.post(`/projects/${project._id}/messages`, {
                message: messageContent,
                sender: messageSender
            });
            console.log('Message saved to database');
        } catch (error) {
            console.error('Failed to save message to database:', error);
        }
    }, [project._id]); // Only recreate if message or user changes
    
    // Handle Enter key press to send message
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default to avoid new line in input
            send();
        }
    }, [send]); // Only recreate if send function changes

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2 max-w-2xl w-full'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    // Logout function
    const handleLogout = () => {
        // Clear user data
        setUser(null)
        // Remove token from localStorage
        localStorage.removeItem('token')
        // Navigate to login page
        navigate('/login')
    }

    // Welcome message animation effect - only runs once on mount
    useEffect(() => {
        // Show welcome message animation with delay
        setTimeout(() => {
            setWelcomeVisible(true)
            
            // Hide welcome message after 2 seconds
            setTimeout(() => {
                setWelcomeVisible(false)
            }, 2000)
        }, 300)
    }, []); // Empty dependency array means this runs only once on mount
    
    // Function to load project data
    const loadProjectData = async () => {
        try {
            const res = await axios.get(`/projects/get-project/${location.state.project._id}`);
            console.log('Project data loaded:', res.data.project);
            setProject(res.data.project);
            // Initialize file tree from project data
            const projectFileTree = res.data.project.fileTree || {};
            console.log('Initializing file tree:', projectFileTree);
            setFileTree(projectFileTree);
        } catch (err) {
            console.error('Error loading project data:', err);
        }
    };
    
    // Function to load all users
    const loadUsers = async () => {
        try {
            const res = await axios.get('/users/all');
            console.log('Users loaded:', res.data.users || res.data);
            setUsers(res.data.users || res.data);
        } catch (err) {
            console.error('Error loading users:', err);
        }
    };
    
    // Function to load messages for the current project with fallback routes
    const loadMessages = async () => {
        try {
            console.log('Loading messages for project:', location.state.project._id);
            
            // Try multiple API endpoints with fallback mechanism
            let response = null;
            const endpoints = [
                `/api/messages/${location.state.project._id}`,
                `/projects/${location.state.project._id}/messages`
            ];
            
            // Try each endpoint until one works
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to load messages from endpoint: ${endpoint}`);
                    const res = await axios.get(endpoint);
                    if (res.status === 200) {
                        response = res;
                        console.log(`Successfully loaded messages from ${endpoint}`);
                        break;
                    }
                } catch (endpointErr) {
                    console.log(`Endpoint ${endpoint} failed:`, endpointErr.message);
                    // Continue to next endpoint if this one fails
                }
            }
            
            if (response && response.data && response.data.messages) {
                console.log(`Loaded ${response.data.messages.length} messages from database`);
                if (response.data.messages.length > 0) {
                    setMessages(response.data.messages);
                    // Scroll to bottom after messages are loaded
                    setTimeout(scrollToBottom, 100);
                }
            } else {
                console.log('No messages found or all endpoints failed');
                // Initialize with empty messages array if none exist yet
                setMessages([]);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            // Initialize with empty messages array on error
            setMessages([]);
        }
    };
    
    // Load project data and messages when component mounts
    useEffect(() => {
        // Track component mount state for cleanup
        let mounted = true;
        
        const loadData = async () => {
            try {
                // Load project data
                await loadProjectData();
                
                // Load users for collaborator selection
                await loadUsers();
                
                // Load messages from the database
                if (mounted) {
                    await loadMessages();
                }
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        
        loadData();
        
        // Cleanup function
        return () => {
            mounted = false;
        };
    }, [location.state.project._id]); // Re-run if project ID changes
    
    // Socket initialization and message handling effect
    useEffect(() => {
        let mounted = true;
        let socket = null;
        
        // Set up an async message handler function that we can reference for removal
        const handleProjectMessage = async (data) => {
            if (!mounted) return; // Prevent updates if component unmounted
            
            console.log('Message received:', data);
            
            if (data.sender._id === 'ai') {
                try {
                    // Parse the message if it's a string, otherwise use as is
                    const message = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
                    console.log('Processing AI message:', message);
                    
                    // Handle file tree if present
                    if (message && message.fileTree) {
                        const newFileTree = message.fileTree;
                        console.log('Processing new file tree:', newFileTree);
                        
                        // Immediately update local state
                        setFileTree(newFileTree);
                        
                        // Save to server
                        await saveFileTree(newFileTree);
                        console.log('Saved to server successfully');

                        // Handle web container mounting if available
                        if (webContainer) {
                            try {
                                console.log('Mounting files in web container...');
                                await webContainer.mount('/', newFileTree);
                                console.log('Files mounted successfully');

                                if (newFileTree['package.json']) {
                                    console.log('Installing dependencies...');
                                    const installProcess = await webContainer.spawn('npm', ['install']);
                                    
                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log('npm install:', chunk);
                                        }
                                    }));

                                    const exitCode = await installProcess.exit;
                                    console.log('Installation process exit code:', exitCode);
                                }
                            } catch (error) {
                                console.error('Web container error:', error);
                            }
                        }
                    }

                    // Always update messages
                    setMessages(prevMessages => [...prevMessages, data]);
                } catch (error) {
                    console.error('Error handling AI message:', error);
                }
            } else {
                // Handle non-AI messages
                setMessages(prevMessages => [...prevMessages, data]);
            }
        };
        
        // Initialize socket asynchronously
        const setupSocket = async () => {
            try {
                // Wait for socket connection to be established
                socket = await initializeSocket(project._id);
                
                // Only register message handler if component is still mounted
                if (mounted) {
                    // Register the message handler
                    receiveMessage('project-message', handleProjectMessage);
                }
            } catch (error) {
                console.error('Failed to initialize socket:', error);
            }
        };
        
        // Initialize the socket connection
        setupSocket();
        
        // Initialize web container if needed
        if (!webContainer) {
            getWebContainer().then(container => {
                if (mounted) {
                    setWebContainer(container);
                    console.log("container started");
                }
            }).catch(error => {
                console.error('Failed to initialize web container:', error);
            });
        }
        
        // Cleanup function to remove event listeners when component unmounts or dependencies change
        return () => {
            mounted = false; // Mark component as unmounted
            
            // Remove the event listener to prevent duplicate messages
            if (socket) {
                socket.off('project-message', handleProjectMessage);
                console.log('Socket listener removed for project-message');
            }
        };
    }, [project._id, webContainer]); // Re-run if project ID or webContainer changes
    
    // Project and user data loading effect
    useEffect(() => {
        // Load project data
        const loadProjectData = async () => {
            try {
                const res = await axios.get(`/projects/get-project/${location.state.project._id}`);
                console.log('Project data loaded:', res.data.project);
                setProject(res.data.project);
                // Initialize file tree from project data
                const projectFileTree = res.data.project.fileTree || {};
                console.log('Initializing file tree:', projectFileTree);
                setFileTree(projectFileTree);
            } catch (err) {
                console.error('Error loading project data:', err);
            }
        };
        
        // Load users
        const loadUsers = async () => {
            try {
                const res = await axios.get('/users/all');
                setUsers(res.data.users || res.data);
            } catch (err) {
                console.error('Error loading users:', err);
            }
        };
        
        // Load messages from database
        const loadMessages = async () => {
            try {
                const res = await axios.get(`/projects/${location.state.project._id}/messages`);
                console.log('Loaded messages from database:', res.data.messages);
                if (res.data.messages && res.data.messages.length > 0) {
                    setMessages(res.data.messages);
                    // Scroll to bottom after messages are loaded
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err) {
                console.error('Error loading messages:', err);
            }
        };
        
        // Execute all data loading functions
        loadProjectData();
        loadUsers();
        loadMessages();
    }, [location.state.project._id]);
    
    // Save file tree to server - memoize with useCallback to prevent recreating on every render
    const saveFileTree = useCallback(async (ft) => {
        try {
            console.log('Saving file tree:', ft);
            const res = await axios.put('/projects/update-file-tree', {
                projectId: project._id,
                fileTree: ft
            });
            console.log('File tree saved successfully:', res.data);
            // Update project state with new file tree
            setProject(prev => ({
                ...prev,
                fileTree: ft
            }));
        } catch (err) {
            console.error('Error saving file tree:', err);
        }
    }, [project._id]);
    
    // Handle file deletion - optimized with useCallback
    const deleteFile = useCallback((filename, e) => {
        // Prevent event bubbling to parent elements
        if (e) {
            e.stopPropagation();
        }
        
        // Set loading state
        setIsDeletingFile(true);
        
        // Create new file tree without the deleted file
        const newFileTree = { ...fileTree };
        delete newFileTree[filename];
        
        // Update state with new file tree
        setFileTree(newFileTree);
        
        // If deleted file is currently open, close it
        if (currentFile === filename) {
            // Find the first available file or set to null if none exist
            const firstAvailableFile = Object.keys(newFileTree)[0] || null;
            setCurrentFile(firstAvailableFile);
        }
        
        // Update open files list (filter out the deleted file)
        setOpenFiles(prevOpenFiles => prevOpenFiles.filter(file => file !== filename));
        
        // Save the updated file tree to the server
        saveFileTree(newFileTree);
        setIsDeletingFile(false);
    }, [fileTree, currentFile, saveFileTree]);
    
    // Simple function to scroll message box to bottom
    const scrollToBottom = useCallback(() => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }, [messageBox])

    return (
        <main className='h-screen w-screen flex bg-gradient-to-br from-blue-50 to-indigo-100'>
            {/* Animated welcome message */}
            <div className={`fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center transform transition-all duration-700 ease-in-out z-50 ${welcomeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <p className="font-medium">You can message collaborators, ask questions to AI using @ai prompt and also run servers here</p>
            </div>
            
            <section className="left relative flex flex-col h-screen min-w-96 bg-white shadow-md">
                <header className='flex justify-between items-center p-4 px-5 w-full bg-white border-b border-gray-200 absolute z-10 top-0'>
                    <div className='flex items-center gap-2'>
                        {/* Go Back button */}
                        <button className='flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg' onClick={() => navigate('/')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <p>Go Back</p>
                        </button>
                        {/* Add collaborator button */}
                        <button className='flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg' onClick={() => setIsModalOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <p>Add collaborator</p>
                        </button>
                    </div>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 hover:bg-blue-100 rounded-full'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </button>
                </header>
                <div className="conversation-area pt-16 pb-12 flex-grow flex flex-col h-full relative">
                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-3xl' : 'max-w-xs md:max-w-sm'} ${msg.sender._id == user._id.toString() ? 'ml-auto bg-blue-100 border-blue-200' : 'bg-white border-gray-200'}  message flex flex-col p-3 shadow-sm border w-fit rounded-lg`}>
                                <small className='text-gray-600 text-xs font-medium mb-1'>{msg.sender.email}</small>
                                <div className={`${msg.sender._id === 'ai' ? 'text-sm overflow-auto max-h-96' : 'text-base'}`}>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p className="text-gray-800">{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 p-2 bg-white border-t border-gray-200 shadow-md">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className='p-3 px-4 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-blue-500 flex-grow transition duration-200' 
                            type="text" 
                            placeholder='Type @ai to ask AI a question...' />
                        <button
                            onClick={send}
                            className='px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition duration-200'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-white absolute transition-all duration-300 shadow-lg ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 z-20`}>
                    <header className='flex justify-between items-center px-5 py-4 bg-white border-b border-gray-200'>
                        <h1 className='font-semibold text-xl text-gray-800'>Collaborators</h1>
                        <button 
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                            className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition duration-200'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-3 p-4">
                        {project.users && project.users.map((collaborator, index) => (
                            <div key={index} className="user bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3 transition-colors duration-200">
                                <div className='aspect-square rounded-full w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600'>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-grow">
                                    <h1 className='font-medium text-gray-800'>{collaborator.email}</h1>
                                </div>
                                {/* Logout button only for the current user */}
                                {user && user._id === collaborator._id && (
                                    <button 
                                        onClick={handleLogout}
                                        title="Logout"
                                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="right bg-white flex-grow h-full flex shadow-md">
                <div className="explorer h-full max-w-64 min-w-52 bg-gray-50 border-r border-gray-200">
                    <div className="p-3 border-b border-gray-200 bg-white">
                        <h2 className="text-gray-700 font-medium text-sm uppercase tracking-wider">Files</h2>
                    </div>
                    <div className="file-tree w-full overflow-y-auto">
                        {Object.keys(fileTree).length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p>No files yet</p>
                            </div>
                        ) : (
                            Object.keys(fileTree).map((file, index) => (
                                <div key={index} className="group relative tree-element hover:bg-gray-100 w-full transition-colors duration-150 border-b border-gray-100">
                                    <button
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                        }}
                                        className="w-full p-3 flex items-center gap-2 text-left">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className='font-medium text-gray-700 truncate'>{file}</p>
                                    </button>
                                    {/* Delete file button */}
                                    <button
                                        title="Delete file"
                                        disabled={isDeletingFile}
                                        onClick={(e) => deleteFile(file, e)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>


                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full bg-gray-50 border-b border-gray-200">
                        <div className="files flex overflow-x-auto">
                            {openFiles.length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm">No open files</div>
                            ) : (
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file cursor-pointer p-3 flex items-center w-fit gap-2 border-r border-gray-200 transition-colors duration-150 ${currentFile === file ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'hover:bg-gray-100 text-gray-700'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className='font-medium text-sm'>{file}</p>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="actions flex gap-2 p-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)

                                    const installProcess = await webContainer.spawn("npm", [ "install" ])

                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url)
                                        setIframeUrl(url)
                                    })
                                }}
                                className='py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Run Server
                            </button>
                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            fileTree[ currentFile ] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>)
                }


            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project