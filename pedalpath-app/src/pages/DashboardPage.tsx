import { Link } from 'react-router-dom'
import { Upload, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your pedal builds and schematics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Projects</h3>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
              <Upload className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to start your first build?
            </h2>
            <p className="text-gray-600 mb-6">
              Upload a schematic to get AI-powered build instructions
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Schematic
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
