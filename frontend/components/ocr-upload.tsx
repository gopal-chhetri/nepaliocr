'use client'

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, CheckCircle, X, ZoomIn, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

export function OcrUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFullPagePreview, setIsFullPagePreview] = useState(false);
  const [isResultMaximized, setIsResultMaximized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file, file.name);

      const response = await fetch(`${process.env.NEXT_PUBLIC_NEPALI_OCR_SERVER}/ocr/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();
      setResult(data.text || 'No text detected');
    } catch (error) {
      console.error('OCR Upload Error:', error);
      setResult('Error processing document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult('');
    setIsFullPagePreview(false);
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload({ target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>);
  };

  const toggleFullPagePreview = () => setIsFullPagePreview(!isFullPagePreview);
  const toggleResultMaximized = () => setIsResultMaximized(!isResultMaximized);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/50 backdrop-blur-md">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary transition-colors bg-gradient-to-br from-primary-50 to-secondary-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleUpload}
              />
              {previewUrl ? (
                <div className="relative w-full h-64 mb-4">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={500}
                    height={500}
                    className={`w-full h-full object-contain rounded-lg ${isFullPagePreview ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                    onClick={toggleFullPagePreview}
                  />
                  <button
                    onClick={handleRemovePreview}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={toggleFullPagePreview}
                    className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-1 hover:bg-primary-600 transition-colors"
                  >
                    <ZoomIn size={20} />
                  </button>
                </div>
              ) : (
                <div className="cursor-pointer w-full" onClick={handleFileSelectClick}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Upload Your Document
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop or click to select
                    </p>
                    <Button className="bg-primary hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
                      Select File
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            <div className="flex flex-col justify-center">
              <AnimatePresence>
                {isUploading ? (
                  <motion.div
                    className="flex items-center justify-center gap-3 text-lg text-primary"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Processing your document...
                  </motion.div>
                ) : result ? (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        <h3 className="font-semibold text-lg">
                          Conversion Complete
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleResultMaximized}
                        className="text-primary hover:text-primary-600"
                      >
                        <Maximize2 size={20} />
                      </Button>
                    </div>
                    <Card className="bg-white shadow-md">
                      <CardContent className="p-4">
                        <Textarea
                          value={result}
                          readOnly
                          className="w-full resize-none text-lg font-medium"
                          lang="ne"
                          rows={4}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    className="text-center text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Upload a document to see the magic happen!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
      {isFullPagePreview && previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={toggleFullPagePreview}
        >
          <div className="max-w-4xl max-h-[90vh] w-full h-full relative">
            <Image
              src={previewUrl}
              alt="Full Page Preview"
              width={500}
              height={500}
              className="w-full h-full object-contain"
            />
            <button
              onClick={toggleFullPagePreview}
              className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
      {isResultMaximized && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full h-full relative flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">OCR Result</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleResultMaximized}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </Button>
            </div>
            <Textarea
              value={result}
              readOnly
              className="w-full flex-grow resize-none text-lg font-medium p-4 rounded-lg border border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              lang="ne"
            />
          </div>
        </div>
      )}
    </div>
  );
}

