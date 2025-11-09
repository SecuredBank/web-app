import { HTMLAttributes, forwardRef, useState, useRef } from 'react'
import { Upload, X, File, Image, FileText } from 'lucide-react'
import { cn } from '@utils/cn'

interface FileUploadProps extends HTMLAttributes<HTMLDivElement> {
  accept?: string
  multiple?: boolean
  maxSize?: number
  onFileSelect?: (files: File[]) => void
  onFileRemove?: (file: File) => void
  files?: File[]
  disabled?: boolean
  dragAndDrop?: boolean
}

const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    className,
    accept,
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB
    onFileSelect,
    onFileRemove,
    files = [],
    disabled = false,
    dragAndDrop = true,
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles)
      const validFiles: File[] = []
      const errors: string[] = []

      fileArray.forEach((file) => {
        if (file.size > maxSize) {
          errors.push(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`)
        } else {
          validFiles.push(file)
        }
      })

      if (errors.length > 0) {
        setError(errors.join(', '))
      } else {
        setError(null)
        onFileSelect?.(validFiles)
      }
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && dragAndDrop) {
        setIsDragOver(true)
      }
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (!disabled && dragAndDrop) {
        handleFileSelect(e.dataTransfer.files)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileSelect(e.target.files)
      }
    }

    const handleRemoveFile = (file: File) => {
      onFileRemove?.(file)
    }

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return <Image className="w-4 h-4" />
      } else if (file.type.startsWith('text/')) {
        return <FileText className="w-4 h-4" />
      } else {
        return <File className="w-4 h-4" />
      }
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragOver && !disabled
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-300 hover:border-secondary-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
          <p className="text-sm text-secondary-600 mb-1">
            {dragAndDrop ? 'Drag and drop files here, or click to select' : 'Click to select files'}
          </p>
          <p className="text-xs text-secondary-500">
            Max file size: {maxSize / 1024 / 1024}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-sm text-danger-600">
            {error}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-secondary-600">
                    {getFileIcon(file)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export default FileUpload

