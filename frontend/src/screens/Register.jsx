import React, { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()


    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }


    const [welcomeVisible, setWelcomeVisible] = useState(false)

    useEffect(() => {
        // Show welcome message with delay for better animation effect
        setTimeout(() => {
            setWelcomeVisible(true)
        }, 300)
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-200">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg w-full max-w-md relative overflow-hidden border border-gray-300">
                {/* Animated welcome message */}
                <div className={`absolute top-0 left-0 right-0 bg-blue-600 text-white p-3 text-center transform transition-all duration-700 ease-in-out ${welcomeVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                    <p className="font-medium">Welcome! Let's create your account</p>
                </div>
                
                <div className="mt-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Register</h2>
                    <form
                        onSubmit={submitHandler}
                        className="space-y-5"
                    >
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">Email</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                id="email"
                                className="w-full p-3 rounded-lg border border-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2" htmlFor="password">Password</label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                id="password"
                                className="w-full p-3 rounded-lg border border-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 transform hover:scale-[1.02]"
                        >
                            Register
                        </button>
                    </form>
                    <p className="text-gray-700 mt-6 text-center">
                        Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition duration-200">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register