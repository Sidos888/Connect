"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Grid3X3, 
  List, 
  Columns, 
  ChevronDown,
  Clock,
  Monitor,
  FileText,
  Download,
  Globe,
  Wifi,
  X
} from "lucide-react";

interface FilePickerModalProps {
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
  type: 'file' | 'photos' | 'contact' | 'event' | 'ai';
}

export default function FilePickerModal({ onClose, onFileSelect, type }: FilePickerModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentLocation, setCurrentLocation] = useState("Desktop");

  // Mock file data
  const mockFiles = [
    { name: "Screenshot 2...1 at 1.42.16 pm", type: "image", timestamp: "1.42 pm" },
    { name: "Screenshot 2...1 at 2.12.16 pm", type: "image", timestamp: "2.12 pm" },
    { name: "Screenshot 2...1 at 2.48.16 pm", type: "image", timestamp: "2.48 pm" },
    { name: "Screenshot 2...1 at 10.06.16 pm", type: "image", timestamp: "10.06 am" },
    { name: "Screenshot 2...1 at 10.34.16 pm", type: "image", timestamp: "10.34 am" },
    { name: "Document.pdf", type: "document", timestamp: "Yesterday" },
    { name: "Presentation.pptx", type: "document", timestamp: "2 days ago" },
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
  };

  const handleOpen = () => {
    onFileSelect(selectedFiles);
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case 'file': return 'Choose File';
      case 'photos': return 'Choose Photos';
      case 'contact': return 'Choose Contact';
      case 'event': return 'Choose Event';
      case 'ai': return 'Choose AI Image';
      default: return 'Choose File';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="w-full max-w-4xl h-[600px] bg-gray-900 rounded-2xl shadow-2xl flex flex-col"
        style={{
          borderWidth: '0.4px',
          borderColor: '#374151',
          borderStyle: 'solid',
          boxShadow: '0 0 1px rgba(100, 100, 100, 0.25), inset 0 0 2px rgba(27, 27, 27, 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-gray-400" />
            <ArrowRight size={20} className="text-gray-400" />
            <div className="flex items-center gap-2 ml-4">
              <List size={20} className="text-gray-400" />
              <Columns size={20} className="text-gray-400" />
              <Grid3X3 size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Monitor size={20} className="text-gray-400" />
              <span className="text-gray-300">{currentLocation}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-800 text-white px-10 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400 mb-2">Favorites</div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">Recents</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Monitor size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">Desktop</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">Documents</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Download size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">Downloads</span>
                </div>
              </div>
              
              <div className="text-sm font-medium text-gray-400 mb-2 mt-6">iCloud</div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Globe size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">iCloud Drive</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Wifi size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">Shared</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="space-y-2">
              {mockFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-gray-300 text-sm">{file.name}</div>
                    <div className="text-gray-500 text-xs">{file.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOpen}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
