import SchematicUpload from '../components/schematic/SchematicUpload'

export default function UploadPage() {
  const handleUploadComplete = (file: File) => {
    console.log('File uploaded:', file.name)
    // TODO: Process file and send to AI for analysis
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Schematic
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to upload your guitar pedal schematic
          </p>
        </div>

        <SchematicUpload onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  )
}
