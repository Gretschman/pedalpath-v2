import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, Clock, CheckCircle, AlertCircle, Trash2, ChevronRight, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useProjects } from '../hooks/useProjects'

function haptic() {
  navigator.vibrate?.(10)
}

export default function DashboardPage() {
  const { projects, isLoading, error, refetch, deleteProject, isDeleting } = useProjects()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(-1)
  const navigate = useNavigate()

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = window.scrollY === 0 ? e.touches[0].clientY : -1
  }
  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (touchStartY.current < 0) return
    if (e.changedTouches[0].clientY - touchStartY.current > 70) {
      haptic()
      setRefreshing(true)
      await refetch()
      setRefreshing(false)
    }
    touchStartY.current = -1
  }

  const totalProjects = projects.length
  // Count 'draft' with schematics as in_progress — status update can fail silently
  const inProgress = projects.filter(p => p.status === 'in_progress' || p.status === 'draft').length
  const completed = projects.filter(p => p.status === 'completed').length

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString))

  return (
    <div
      className="page-shell bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Navbar />

      {/* Pull-to-refresh spinner */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">Your pedal builds and schematics</p>
        </div>

        {/* Stats — iOS grouped inline row */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex divide-x divide-gray-100">
            {[
              { label: 'Projects', value: totalProjects, icon: Clock, iconClass: 'text-gray-400' },
              { label: 'In Progress', value: inProgress, icon: Upload, iconClass: 'text-blue-500' },
              { label: 'Completed', value: completed, icon: CheckCircle, iconClass: 'text-green-500' },
            ].map(({ label, value, icon: Icon, iconClass }) => (
              <div key={label} className="flex-1 py-4 px-2 text-center">
                <Icon className={`w-4 h-4 ${iconClass} mx-auto mb-1.5`} />
                {isLoading
                  ? <div className="h-6 w-8 bg-gray-100 rounded animate-pulse mx-auto" />
                  : <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
                }
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
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

                const resultUrl = processingStatus === 'completed' && schematic
                  ? `/results/${schematic.id}`
                  : null

                return (
                  <div key={project.id} className="bg-white rounded-xl shadow flex flex-col gap-3 overflow-hidden">
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 leading-snug">{project.title}</h3>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          project.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          {project.status === 'completed' ? 'Done' : 'Active'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">Uploaded {formatDate(project.created_at)}</p>

                      {confidence != null && (
                        <p className="text-sm text-gray-600">AI confidence: {confidence}%</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-1">
                        {resultUrl ? (
                          <button
                            onClick={() => { haptic(); navigate(resultUrl) }}
                            className="flex-grow text-left text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors"
                          >
                            View Results <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : processingStatus === 'failed' ? (
                          <p className="text-sm text-gray-400">Analysis failed</p>
                        ) : (
                          <p className="text-sm text-gray-400">Processing...</p>
                        )}

                        {confirmDeleteId === project.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { deleteProject(project.id); setConfirmDeleteId(null) }}
                              disabled={isDeleting}
                              className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1.5 rounded transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { haptic(); setConfirmDeleteId(project.id) }}
                            className="p-2 -mr-1 text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
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
