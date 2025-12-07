import { useState } from 'react'

type Props = {
  prompt: string
  onPromptChange: (prompt: string) => void
  imageData: string | null
  onImageChange: (imageData: string | null) => void
  onSubmit: () => void
  loading: boolean
}

export default function PromptInput({
  prompt,
  onPromptChange,
  imageData,
  onImageChange,
  onSubmit,
  loading,
}: Props) {
  const [dragActive, setDragActive] = useState(false)

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      onImageChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0])
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Enter Your Prompt</h2>

      <textarea
        value={prompt}
        onChange={e => onPromptChange(e.target.value)}
        placeholder="Enter your prompt here... (text, questions, instructions, etc.)"
        className="w-full h-32 p-4 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
      />

      <div className="mt-4">
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive
              ? 'border-purple-400 bg-purple-500/20'
              : 'border-gray-600 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF (optional)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
          />
        </label>
      </div>

      {imageData && (
        <div className="mt-4 relative">
          <img
            src={imageData}
            alt="Uploaded"
            className="max-h-48 rounded-lg border border-gray-600"
          />
          <button
            onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className={`mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          loading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Generate & Compare Responses'
        )}
      </button>
    </div>
  )
}
