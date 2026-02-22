import { Link } from 'react-router-dom'
import { Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useProjects } from '../hooks/useProjects'

export default function DashboardPage() {
  const { projects, isLoading, error } = useProjects()

  const totalProjects = projects.length
  // Count 'draft' with schematics as in_progress — status update can fail silently
  const inProgress = projects.filter(p => p.status === 'in_progress' || p.status === 'draft').length
  const completed = projects.filter(p => p.status === 'completed').length

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString))

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

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Projects</h3>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            {isLoading ? (
              <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
              <Upload className="w-5 h-5 text-blue-500" />
            </div>
            {isLoading ? (
              <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{inProgress}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            {isLoading ? (
              <div className="h-9 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{completed}</p>
            )}
          </div>
        </div>

        {/* Projects section */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1].map(i => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Failed to load projects. Please refresh and try again.</p>
          </div>
        ) : projects.length === 0 ? (
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
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                New Upload
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => {
                const schematic = project.schematics[0]
                const confidence = schematic?.ai_confidence_score
                const processingStatus = schematic?.processing_status

                return (
                  <div key={project.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 leading-snug">{project.title}</h3>
                      <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                        project.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">Uploaded {formatDate(project.created_at)}</p>

                    {confidence != null && (
                      <p className="text-sm text-gray-600">AI confidence: {confidence}%</p>
                    )}

                    {processingStatus === 'completed' && schematic ? (
                      <Link
                        to={`/results/${schematic.id}`}
                        className="self-end text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View Results →
                      </Link>
                    ) : processingStatus === 'failed' ? (
                      <p className="self-end text-sm text-gray-400">Analysis failed</p>
                    ) : (
                      <p className="self-end text-sm text-gray-400">Processing...</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
