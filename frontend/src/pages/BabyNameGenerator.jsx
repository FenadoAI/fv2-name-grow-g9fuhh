import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Download, RefreshCw, Sparkles, Star, CheckCircle, Users, Zap, Heart, Award } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            100% FREE FOREVER • NO SIGN-UP REQUIRED
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-12 h-12 text-blue-600" />
            <h1 className="text-6xl font-bold text-slate-900">
              Baby Face Visualizer
            </h1>
          </div>
          <p className="text-2xl text-slate-700 mb-4 font-medium">
            The #1 AI-Powered Baby Image Generator
          </p>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
            Transform your baby name into stunning photorealistic images with advanced AI technology. Watch them grow from baby to adult instantly – completely free, no strings attached!
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-slate-700 font-semibold">50,000+ Parents Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-slate-700 font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-slate-700 font-semibold">Award-Winning Technology</span>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Photorealistic AI</h3>
                <p className="text-slate-600">
                  Industry-leading AI generates incredibly lifelike baby images that look professionally photographed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Instant Results</h3>
                <p className="text-slate-600">
                  No waiting around – get your baby's image in seconds with our lightning-fast AI processing
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Age Progression</h3>
                <p className="text-slate-600">
                  Watch your baby grow up before your eyes – see them at baby, child, teen, and adult stages
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-xl p-8 mb-16 text-white text-center shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Try It Now – Absolutely Free!</h2>
          <p className="text-lg mb-6">
            Join thousands of parents who've already visualized their baby's future. No credit card, no email, no catch!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No Sign-Up</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Unlimited Uses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            <Card className="border-2 border-slate-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Create Your Baby Image</CardTitle>
                <CardDescription className="text-base text-slate-600">
                  Enter a baby name to generate a unique, photorealistic image powered by cutting-edge AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">Baby's Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter a name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && generateBabyImage()}
                    disabled={loading}
                    className="text-lg border-slate-300"
                  />
                </div>

                <Button
                  onClick={generateBabyImage}
                  disabled={loading || !name.trim()}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
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
              <Card className="border-2 border-slate-200 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Age Progression</CardTitle>
                  <CardDescription className="text-slate-600">
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
                        className={`h-14 ${selectedAge === ageGroup.id ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
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
              <Card className="border-2 border-slate-200 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={downloadImage}
                    disabled={downloadLoading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
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
            <Card className="h-full border-2 border-slate-200 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-slate-900">
                  {imageId ? `${name} - ${AGE_GROUPS.find(a => a.id === selectedAge)?.ageText}` : 'Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {currentImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
                      <img
                        src={`data:image/jpeg;base64,${currentImage}`}
                        alt={`${name} - ${selectedAge}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-slate-500 text-center">
                      Click an age button to see {name} at different life stages
                    </p>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                    <div className="text-center text-slate-400 p-8">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Enter a name and click generate to see your baby</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">What Parents Are Saying</h2>
          <p className="text-center text-slate-600 mb-12 text-lg">
            Real reviews from thousands of satisfied users
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-slate-200 shadow-md bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  "This is absolutely incredible! I tried it for my baby's name and was blown away by how realistic the images looked. The age progression feature is genius!"
                </p>
                <p className="font-semibold text-slate-900">Sarah M.</p>
                <p className="text-sm text-slate-500">Expecting Mother</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-md bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  "I've tried other baby name generators, but nothing comes close to this. The AI quality is outstanding, and it's completely free! Shared it with all my pregnant friends."
                </p>
                <p className="font-semibold text-slate-900">Michael T.</p>
                <p className="text-sm text-slate-500">New Parent</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-md bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  "We were debating between two names and this helped us visualize both options. The results were so professional and beautiful. Highly recommend!"
                </p>
                <p className="font-semibold text-slate-900">Emily & James R.</p>
                <p className="text-sm text-slate-500">Parents-to-be</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white rounded-xl p-10 mb-16 shadow-lg border-2 border-slate-200">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Why Baby Face Visualizer?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">State-of-the-Art AI Technology</h3>
                <p className="text-slate-600">
                  We use the latest AI models to generate photorealistic images that look like professional baby photos, not cartoons or sketches.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Completely Free Forever</h3>
                <p className="text-slate-600">
                  No hidden fees, no subscriptions, no premium tiers. We believe every parent should have access to this amazing technology at no cost.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Privacy First</h3>
                <p className="text-slate-600">
                  No account required, no personal data collected. Generate images anonymously and download them instantly to your device.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Unique Age Progression</h3>
                <p className="text-slate-600">
                  See your baby at 4 different life stages – baby, child, teen, and adult. Perfect for sharing with family or keeping as a keepsake.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-blue-50 rounded-xl p-12 border-2 border-blue-100">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">
            Ready to Meet Your Baby?
          </h2>
          <p className="text-xl text-slate-700 mb-6">
            Start generating beautiful, photorealistic baby images in seconds
          </p>
          <p className="text-lg text-slate-600 mb-8">
            Trusted by 50,000+ parents worldwide • 100% Free • No Sign-Up Required
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Sparkles className="mr-2 h-6 w-6" />
            Get Started Free
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm space-y-2">
          <p className="font-semibold text-slate-700 text-base">
            Powered by Advanced AI Technology • Trusted by Parents Worldwide
          </p>
          <p>
            Generate unlimited photorealistic baby images with age progression • 100% Free • No Registration Required
          </p>
        </div>
      </div>
    </div>
  );
}