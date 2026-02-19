import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { getBOMData } from '../services/schematic-processor';
import BOMTable from '../components/bom/BOMTable';
import BOMExport from '../components/bom/BOMExport';
import BreadboardGuide from '../components/guides/BreadboardGuide';
import StripboardGuide from '../components/guides/StripboardGuide';
import EnclosureGuide from '../components/guides/EnclosureGuide';

export default function ResultsPage() {
  const { schematicId } = useParams<{ schematicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bom' | 'breadboard' | 'stripboard' | 'enclosure'>('bom');

  const { data: bomData, isLoading, error } = useQuery({
    queryKey: ['schematic', schematicId],
    queryFn: () => getBOMData(schematicId!),
    enabled: !!schematicId,
  });

  const queryClient = useQueryClient()

  const { data: projectData } = useQuery({
    queryKey: ['schematic-project', schematicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schematics')
        .select('project_id, projects(status)')
        .eq('id', schematicId!)
        .single()
      if (error) throw error
      return data as unknown as { project_id: string; projects: { status: string } | null }
    },
    enabled: !!schematicId,
  })

  const projectId = projectData?.project_id
  const isAlreadySaved = projectData?.projects?.status === 'completed'

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('No project ID')
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['schematic-project', schematicId] })
    },
    onError: (err) => {
      console.error('Save project failed:', err)
    },
  })

  const isSaved = isAlreadySaved || saveMutation.isSuccess
  const isSaving = saveMutation.isPending
  const saveError = saveMutation.isError
    ? (saveMutation.error instanceof Error ? saveMutation.error.message : 'Save failed — please try again')
    : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Results</h2>
            <p className="text-red-700 mb-4">
              {error instanceof Error ? error.message : 'Failed to load analysis results'}
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Another Schematic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analysis Results</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Your pedal schematic analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium text-sm">
                AI Confidence: {bomData.confidence_score}%
              </span>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => { if (!isSaved && !isSaving) saveMutation.mutate() }}
                  disabled={isSaved || isSaving || !projectId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isSaved ? 'bg-green-100 text-green-700 cursor-default'
                    : saveError ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Save size={18} />
                  <span className="hidden sm:inline">
                    {isSaved ? 'Saved ✓' : isSaving ? 'Saving...' : !projectId ? 'Loading...' : saveError ? 'Save Failed' : 'Save Project'}
                  </span>
                </button>
                {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
              </div>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Upload Another</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('bom')}
              className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bom'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bill of Materials
            </button>
            <button
              onClick={() => setActiveTab('breadboard')}
              className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'breadboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Breadboard Guide
            </button>
            <button
              onClick={() => setActiveTab('stripboard')}
              className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stripboard'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stripboard Guide
            </button>
            <button
              onClick={() => setActiveTab('enclosure')}
              className={`flex-shrink-0 py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'enclosure'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enclosure Guide
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bom' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ Analysis Complete</h3>
              <p className="text-green-800 text-sm">
                Your schematic has been analyzed by Claude Vision AI. Review the components below
                and click on any item to edit or verify it.
              </p>
            </div>

            <BOMTable bomData={bomData} onUpdate={() => console.log('BOM updated')} />
            <BOMExport bomData={bomData} projectName="My Pedal Build" />
          </div>
        )}

        {activeTab === 'breadboard' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">🍞 Breadboard Prototyping</h3>
              <p className="text-blue-800 text-sm">
                Interactive step-by-step guide for building your prototype on a breadboard.
                Track your progress as you complete each step.
              </p>
            </div>
            <BreadboardGuide bomData={bomData} projectName="My Pedal Build" />
          </div>
        )}

        {activeTab === 'stripboard' && (
          <div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">📐 Stripboard Build</h3>
              <p className="text-purple-800 text-sm">
                Transfer your working breadboard to permanent stripboard. Includes component placement,
                track cuts, and wiring instructions.
              </p>
            </div>
            <StripboardGuide bomData={bomData} projectName="My Pedal Build" />
          </div>
        )}

        {activeTab === 'enclosure' && (
          <div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">📦 Final Assembly</h3>
              <p className="text-orange-800 text-sm">
                LEGO-style instructions for drilling and wiring your pedal enclosure.
                Includes drill template and 3PDT wiring diagram.
              </p>
            </div>
            <EnclosureGuide bomData={bomData} projectName="My Pedal Build" />
          </div>
        )}
      </div>
    </div>
  );
}
