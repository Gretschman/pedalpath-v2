import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SchematicUpload from '../components/schematic/SchematicUpload'
import { prepareSchematic, analyzeSchematic } from '../services/schematic-processor'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { supabase } from '../services/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { UpgradeModal } from '../components/UpgradeModal'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  useSubscription(user?.id) // kept for future quota enforcement

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
      const userId = user.id // NO FALLBACK - must be authenticated

      // STEP 0: Credit gate — check balance and deduct 1 credit
      const creditRes = await fetch('/api/consume-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const creditData = await creditRes.json()
      if (!creditRes.ok || !creditData.allowed) {
        setShowUpgrade(true)
        setLoading(false)
        return
      }

      console.log('Starting upload process:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
        userEmail: user.email
      })

      // STEP 1: Create project record in database first
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          title: (() => {
            const base = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
            const generic = ['image', 'photo', 'img', 'screenshot', 'file', 'scan', 'document', 'pic', 'untitled']
            if (generic.includes(base.toLowerCase()) || /^img[\s_]?\d+$/i.test(base)) {
              const d = new Date()
              return `Schematic ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
            return base
          })(),
          status: 'draft'
        })
        .select()
        .single()

      if (projectError || !project) {
        console.error('Error creating project:', projectError)
        setError('Failed to create project. Please try again.')
        setLoading(false)
        return
      }

      console.log('Project created:', project.id)

      // STEP 2: Phase 1 — upload + create DB record (fast, ~2-3s)
      const prepared = await prepareSchematic(project.id, file, userId)

      console.log('Schematic prepared, navigating immediately:', prepared.schematicId)

      // STEP 3: Credit was already deducted at STEP 0 (consume-credit API)

      // Navigate immediately — analysis runs in background
      navigate(`/results/${prepared.schematicId}?status=processing`)

      // Phase 2 — fire-and-forget: AI analysis runs after navigation
      analyzeSchematic(prepared.schematicId, prepared.imageBase64, prepared.imageType, userId)
        .catch(err => console.error('Background analysis failed:', err))
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
            <p className="text-gray-600 text-lg font-medium">Uploading schematic...</p>
            <p className="text-gray-500 text-sm mt-2">You'll be redirected when upload is ready</p>
          </div>
        ) : (
          <SchematicUpload onUploadComplete={handleUploadComplete} />
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        userId={user?.id ?? ''}
        userEmail={user?.email ?? ''}
      />
    </div>
  )
}
