import { Link } from 'react-router-dom'
import { Guitar } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-6 shadow-lg">
            <Guitar className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            PedalPath
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-Assisted Guitar Pedal Building
          </p>
          <p className="text-lg text-gray-500">
            Upload a schematic, get Lego-simple build instructions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload</h3>
              <p className="text-sm text-gray-600">
                Camera, photo roll, or file upload
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Automatic component recognition
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="text-4xl mb-3">🎸</div>
              <h3 className="font-semibold text-gray-900 mb-2">Build</h3>
              <p className="text-sm text-gray-600">
                Step-by-step instructions
              </p>
            </div>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demo"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                🎨 View Demo
              </Link>
              <Link
                to="/signup"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Week 2: Complete - All features implemented ✓
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>React + TypeScript + Supabase + Claude AI</p>
        </div>
      </div>
    </div>
  )
}
