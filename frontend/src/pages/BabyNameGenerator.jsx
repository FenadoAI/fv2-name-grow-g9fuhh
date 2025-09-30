import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Download, RefreshCw, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const API = `${API_BASE}/api`;

const AGE_GROUPS = [
  { id: 'baby', label: 'Baby', ageText: 'Baby (0-2 years)' },
  { id: 'child', label: 'Child', ageText: 'Child (5-8 years)' },
  { id: 'teen', label: 'Teen', ageText: 'Teen (14-16 years)' },
  { id: 'adult', label: 'Adult', ageText: 'Adult (20-25 years)' }
];

export default function BabyNameGenerator() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageId, setImageId] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedAge, setSelectedAge] = useState('baby');
  const [error, setError] = useState('');
  const [ageLoading, setAgeLoading] = useState({});
  const [downloadLoading, setDownloadLoading] = useState(false);

  const generateBabyImage = async () => {
    if (!name.trim()) {
      setError('Please enter a baby name');
      return;
    }

    setLoading(true);
    setError('');
    setImageId(null);
    setCurrentImage(null);

    try {
      const response = await axios.post(`${API}/baby/generate`, {
        name: name.trim()
      });

      if (response.data.success) {
        setImageId(response.data.image_id);
        setCurrentImage(response.data.image_data);
        setSelectedAge('baby');
      } else {
        setError(response.data.error || 'Failed to generate baby image');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate baby image');
    } finally {
      setLoading(false);
    }
  };

  const changeAge = async (ageGroup) => {
    if (!imageId) return;

    setAgeLoading({ ...ageLoading, [ageGroup]: true });
    setError('');

    try {
      const response = await axios.post(`${API}/baby/age-progress`, {
        image_id: imageId,
        name: name.trim(),
        age_group: ageGroup
      });

      if (response.data.success) {
        setCurrentImage(response.data.image_data);
        setSelectedAge(ageGroup);
      } else {
        setError(response.data.error || 'Failed to generate aged image');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate aged image');
    } finally {
      setAgeLoading({ ...ageLoading, [ageGroup]: false });
    }
  };

  const downloadImage = async () => {
    if (!currentImage) return;

    setDownloadLoading(true);
    setError('');

    try {
      const ageLabel = AGE_GROUPS.find(a => a.id === selectedAge)?.label || 'Baby';

      const response = await axios.post(`${API}/baby/watermark`, {
        image_data: currentImage,
        name: name.trim(),
        age: ageLabel
      });

      if (response.data.success) {
        // Convert base64 to blob and download
        const byteCharacters = atob(response.data.watermarked_image);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.trim()}-${ageLabel}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError(response.data.error || 'Failed to add watermark');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to download image');
    } finally {
      setDownloadLoading(false);
    }
  };

  const regenerate = () => {
    setImageId(null);
    setCurrentImage(null);
    setSelectedAge('baby');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Baby Name Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Bring your baby's name to life with AI-powered photorealistic images
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Baby</CardTitle>
                <CardDescription>
                  Enter a baby name to generate a unique, photorealistic image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Baby's Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter a name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && generateBabyImage()}
                    disabled={loading}
                    className="text-lg"
                  />
                </div>

                <Button
                  onClick={generateBabyImage}
                  disabled={loading || !name.trim()}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Baby
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Age Toggle */}
            {imageId && (
              <Card>
                <CardHeader>
                  <CardTitle>Age Progression</CardTitle>
                  <CardDescription>
                    See how {name} looks at different ages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map((ageGroup) => (
                      <Button
                        key={ageGroup.id}
                        variant={selectedAge === ageGroup.id ? 'default' : 'outline'}
                        onClick={() => changeAge(ageGroup.id)}
                        disabled={ageLoading[ageGroup.id]}
                        className="h-14"
                      >
                        {ageLoading[ageGroup.id] ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {ageGroup.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {imageId && currentImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={downloadImage}
                    disabled={downloadLoading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                  >
                    {downloadLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download Image
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={regenerate}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Start Over
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Image Display */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  {imageId ? `${name} - ${AGE_GROUPS.find(a => a.id === selectedAge)?.ageText}` : 'Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {currentImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={`data:image/jpeg;base64,${currentImage}`}
                        alt={`${name} - ${selectedAge}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Click an age button to see {name} at different life stages
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-400 p-8">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Enter a name and click generate to see your baby</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by AI • Generate photorealistic baby images with age progression</p>
        </div>
      </div>
    </div>
  );
}