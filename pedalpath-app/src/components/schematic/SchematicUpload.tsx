import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Camera, Image as ImageIcon, Upload, X, Check } from 'lucide-react'

interface SchematicUploadProps {
  onUploadComplete?: (file: File) => void
}

export default function SchematicUpload({ onUploadComplete }: SchematicUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'camera' | 'photo' | 'file' | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedFileTypes = 'image/png,image/jpeg,image/jpg,application/pdf'
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.split(',').includes(file.type)) {
      return 'Please upload a PNG, JPG, or PDF file'
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB'
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      alert(error)
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    if (onUploadComplete) {
      onUploadComplete(file)
    }
  }

  const handleCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadMethod('camera')
      handleFileSelect(file)
    }
  }

  const handlePhotoSelection = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadMethod('photo')
      handleFileSelect(file)
    }
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadMethod('file')
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      setUploadMethod('file')
      handleFileSelect(file)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadMethod(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (photoInputRef.current) photoInputRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (selectedFile) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-green-600">
            <Check className="w-6 h-6 mr-2" />
            <span className="font-semibold">File uploaded successfully</span>
          </div>
          <button
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {previewUrl && (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Schematic preview"
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">File name:</span>
                <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
              </div>
              <div>
                <span className="text-gray-600">File size:</span>
                <p className="font-medium text-gray-900">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div>
                <span className="text-gray-600">File type:</span>
                <p className="font-medium text-gray-900">{selectedFile.type}</p>
              </div>
              <div>
                <span className="text-gray-600">Upload method:</span>
                <p className="font-medium text-gray-900 capitalize">{uploadMethod}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Upload Different File
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Camera Capture */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Take Photo</h3>
          <p className="text-sm text-gray-600">
            Use your camera to capture a schematic
          </p>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {/* Photo Roll Selection */}
        <button
          onClick={() => photoInputRef.current?.click()}
          className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <ImageIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Photo Roll</h3>
          <p className="text-sm text-gray-600">
            Select an existing photo from your device
          </p>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handlePhotoSelection}
          className="hidden"
        />

        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <Upload className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Upload File</h3>
          <p className="text-sm text-gray-600">
            Upload an image or PDF from your computer
          </p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-3 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-white'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
        <p className="text-lg font-semibold text-gray-900 mb-2">
          Or drag and drop your file here
        </p>
        <p className="text-sm text-gray-600">
          PNG, JPG, or PDF • Max 10MB
        </p>
      </div>

      {/* File Format Info */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Accepted formats:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Images: PNG, JPG, JPEG</li>
          <li>• Documents: PDF</li>
          <li>• Max file size: 10MB</li>
        </ul>
      </div>
    </div>
  )
}
