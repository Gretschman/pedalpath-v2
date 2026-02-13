import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SchematicUpload from '../components/schematic/SchematicUpload'
import { processSchematic } from '../services/schematic-processor'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleUploadComplete = async (file: File) => {
    setLoading(true)
    setError(null)

    // CRITICAL: Check authentication FIRST
    if (!user || !user.id) {
      setError('You must be signed in to upload schematics. Please sign in and try again.')
      setLoading(false)
      navigate('/signin')
      return
    }

    try {
      // Create temporary project ID
      const projectId = crypto.randomUUID()
      const userId = user.id // NO FALLBACK - must be authenticated

      console.log('Starting upload process:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        projectId,
        userId,
        userEmail: user.email
      })

      // Process schematic
      const result = await processSchematic(projectId, file, userId)

      console.log('Process schematic result:', result)

      if (result.success && result.schematicId) {
        navigate(`/results/${result.schematicId}`)
      } else {
        const errorMsg = result.error || 'Analysis failed'
        console.error('Upload failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Upload error:', err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Schematic
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to upload your guitar pedal schematic
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Analyzing schematic with AI...</p>
            <p className="text-gray-500 text-sm mt-2">This usually takes 5-10 seconds</p>
          </div>
        ) : (
          <SchematicUpload onUploadComplete={handleUploadComplete} />
        )}
      </div>
    </div>
  )
}
