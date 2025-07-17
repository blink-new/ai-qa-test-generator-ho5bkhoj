import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Dashboard } from '@/pages/Dashboard'
import { blink } from '@/blink/client'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-8">
            <div className="h-16 w-16 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">QA</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI QA Test Generator
            </h1>
            <p className="text-gray-600">
              Record user interactions and generate automated test cases with AI
            </p>
          </div>
          
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Sign In to Continue
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Secure authentication powered by Blink
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <Dashboard />
    </div>
  )
}

export default App