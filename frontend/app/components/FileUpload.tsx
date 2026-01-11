'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onSessionUploaded: () => void;
}

export default function FileUpload({ onSessionUploaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('Error: Please select a valid audio file (MP3, WAV, M4A, OGG, WebM)');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('Error: File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Success: ${result.message}`);
        onSessionUploaded();
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        setUploadStatus(`Error: ${error.message || 'Upload failed'}`);
      }
    } catch (error) {
      setUploadStatus('Error: Network error occurred');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upload Audio Session</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.m4a,.ogg,.webm"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-4">
            {uploading ? '⏳' : '🎵'}
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            {uploading ? 'Uploading...' : 'Drop audio file here or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports MP3, WAV, M4A, OGG, WebM (max 50MB)
          </p>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 p-3 rounded ${
            uploadStatus.startsWith('Error')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : uploadStatus.startsWith('Success')
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {uploadStatus}
        </div>
      )}
    </div>
  );
}