import React, { useState } from 'react';
import { 
  Sparkles, Image as ImageIcon, Wand2, Download, RefreshCw, 
  Layers, Sliders, AlertCircle, Check, ArrowRight, Eye, Edit3, Camera
} from 'lucide-react';
import { GeneratedAmbianceImage } from '../types';

const PRESET_PROMPTS = [
  'Tranquil Japanese Zen massage suite with warm Hinoki cedar walls, tatami mats, and smooth black river stones with soft ambient candlelight',
  'Luxury Nordic wellness sanctuary with organic linen massage bed, Himalayan salt crystal lamps, and eucalyptus steam diffusion',
  'Balinese tropical botanical spa pavilion surrounded by lush monstera leaves, natural sunlight filtering through bamboo, and warm coconut oil bowls',
  'Minimalist serene treatment room with neutral travertine stone, warm recessed cove lighting, and fresh white orchid centerpiece'
];

export const AmbianceStudio: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0]);
  const [model, setModel] = useState<string>('gemini-3-pro-image-preview');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Editing mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<GeneratedAmbianceImage | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('Add soft twilight ambient lighting and gentle eucalyptus steam');

  // Generated images gallery
  const [gallery, setGallery] = useState<GeneratedAmbianceImage[]>([
    {
      id: 'init-1',
      url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Minimalist Scandinavian cedar wood massage suite with warm amber salt lamps',
      model: 'gemini-3-pro-image-preview',
      aspectRatio: '16:9',
      imageSize: '2K',
      createdAt: new Date().toISOString()
    },
    {
      id: 'init-2',
      url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Tranquil botanical aromatherapy sanctuary with smooth hot stones and lavender',
      model: 'gemini-3.1-flash-image-preview',
      aspectRatio: '4:3',
      imageSize: '1K',
      createdAt: new Date().toISOString()
    }
  ]);

  const [activePreviewImage, setActivePreviewImage] = useState<GeneratedAmbianceImage | null>(gallery[0]);

  // Handle Text-to-Image Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          imageSize
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate image');
      }

      const result = await res.json();
      const newImage: GeneratedAmbianceImage = {
        id: 'img-' + Date.now(),
        url: result.imageUrl,
        prompt: result.prompt || prompt,
        model: result.model || model,
        aspectRatio: result.aspectRatio || aspectRatio,
        imageSize: result.imageSize || imageSize,
        createdAt: new Date().toISOString()
      };

      setGallery([newImage, ...gallery]);
      setActivePreviewImage(newImage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Image Editing
  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageForEdit || !editPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          baseImageUrl: selectedImageForEdit.url,
          model: 'gemini-3.1-flash-image-preview',
          aspectRatio: selectedImageForEdit.aspectRatio
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to edit image');
      }

      const result = await res.json();
      const newImage: GeneratedAmbianceImage = {
        id: 'img-edit-' + Date.now(),
        url: result.imageUrl,
        prompt: `Edited: "${editPrompt}" from (${selectedImageForEdit.prompt})`,
        model: result.model || 'gemini-3.1-flash-image-preview',
        aspectRatio: selectedImageForEdit.aspectRatio,
        imageSize: selectedImageForEdit.imageSize || '1K',
        createdAt: new Date().toISOString()
      };

      setGallery([newImage, ...gallery]);
      setActivePreviewImage(newImage);
      setIsEditMode(false);
      setSelectedImageForEdit(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Image editing failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (img: GeneratedAmbianceImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `spa-ambiance-${img.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-sans font-bold text-slate-900">Spa Ambiance AI Studio</h1>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Gemini Vision Studio
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Generate custom restorative treatment room concepts and meditative background themes using <strong>gemini-3-pro-image-preview</strong> and <strong>gemini-3.1-flash-image-preview</strong>.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              !isEditMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New (Text-to-Image)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(true);
              if (!selectedImageForEdit && gallery.length > 0) {
                setSelectedImageForEdit(gallery[0]);
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              isEditMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Existing Image</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!isEditMode ? (
            /* TEXT TO IMAGE FORM */
            <form onSubmit={handleGenerate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-600" />
                <span>Text-to-Image Prompt</span>
              </h3>

              {/* Prompt input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Describe Your Massage Ambiance Sanctuary
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe treatment room interior, botanical elements, lighting, aroma diffuser, water features..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Preset Prompts */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Try Inspiration Presets:
                </label>
                <div className="space-y-1.5">
                  {PRESET_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent text-[11px] text-slate-600 transition cursor-pointer line-clamp-1"
                    >
                      • {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Choice (gemini-3-pro-image-preview vs gemini-3.1-flash-image-preview) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Gemini Generation Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModel('gemini-3-pro-image-preview')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      model === 'gemini-3-pro-image-preview'
                        ? 'border-blue-600 bg-blue-50/50 text-slate-950 ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Gemini 3 Pro Image</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">High-fidelity 4K studio clarity</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModel('gemini-3.1-flash-image-preview')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      model === 'gemini-3.1-flash-image-preview'
                        ? 'border-blue-600 bg-blue-50/50 text-slate-950 ring-1 ring-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Gemini 3.1 Flash Image</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Lightning-fast generation</div>
                  </button>
                </div>
              </div>

              {/* Image Size Selection (Affordance for 1K, 2K, 4K) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Image Resolution Size
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    {model === 'gemini-3-pro-image-preview' ? 'Pro 4K Enabled' : 'Flash High-Res'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as ('1K' | '2K' | '4K')[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center ${
                        imageSize === size
                          ? 'border-blue-600 bg-blue-700 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{size}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {size === '1K' ? '1024 px' : size === '2K' ? '2048 px' : '4096 px'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['1:1', '4:3', '16:9', '3:4', '9:16'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${
                        aspectRatio === ratio
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-blue-700 text-white font-bold text-xs tracking-wide hover:bg-blue-600 transition shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Ambiance Image with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span>Generate Ambiance Visual</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* EDIT EXISTING IMAGE FORM */
            <form onSubmit={handleEditImage} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Ambiance with gemini-3.1-flash-image-preview</span>
              </h3>

              {/* Target Image to edit */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  1. Selected Base Image to Edit
                </label>
                {selectedImageForEdit ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <img 
                      src={selectedImageForEdit.url} 
                      alt="Base" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block line-clamp-1">{selectedImageForEdit.prompt}</span>
                      <span className="text-[10px] text-slate-400">Ratio: {selectedImageForEdit.aspectRatio} • Size: {selectedImageForEdit.imageSize}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Please select an image from the gallery on the right to edit.</p>
                )}
              </div>

              {/* Edit text prompt */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  2. Describe the Changes / Adjustments
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Add gentle eucalyptus steam rising from the tea cups', 'Change lighting to evening sunset warm glow'..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !selectedImageForEdit}
                className="w-full py-3 rounded-xl bg-blue-700 text-white font-bold text-xs tracking-wide hover:bg-blue-600 transition shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Edits with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-blue-300" />
                    <span>Transform &amp; Apply Edits</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Active Preview & Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Preview */}
          {activePreviewImage && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 max-h-[460px] flex items-center justify-center group">
                <img
                  src={activePreviewImage.url}
                  alt={activePreviewImage.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[460px] object-cover transition duration-300"
                />

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-4 text-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-slate-950/80 px-2 py-0.5 rounded border border-blue-700/60">
                      {activePreviewImage.model} • {activePreviewImage.imageSize} • {activePreviewImage.aspectRatio}
                    </span>

                    <button
                      type="button"
                      onClick={() => downloadImage(activePreviewImage)}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 mt-2 font-sans line-clamp-2">
                    "{activePreviewImage.prompt}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Gallery List */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Ambiance Gallery ({gallery.length} visual assets)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((img) => {
                const isActive = activePreviewImage?.id === img.id;
                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      setActivePreviewImage(img);
                      if (isEditMode) setSelectedImageForEdit(img);
                    }}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer group transition ${
                      isActive ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-28 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
