import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, RefreshCw, Sparkles, Star, CheckCircle, Users, Zap, Heart, Award, ArrowUp } from 'lucide-react';
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
  const [linkId, setLinkId] = useState(null);

  // Track page view on mount
  React.useEffect(() => {
    trackAction('view');
  }, []);

  const trackAction = async (action, metadata = {}) => {
    try {
      const response = await axios.post(`${API}/track`, {
        link_id: linkId,
        action,
        metadata
      });
      if (response.data.success && !linkId) {
        setLinkId(response.data.link_id);
      }
    } catch (err) {
      // Silently fail - tracking should not disrupt user experience
      console.log('Tracking error:', err);
    }
  };

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
        // Track generation
        trackAction('generate', { name: name.trim() });
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

        // Track download
        trackAction('download', { name: name.trim(), age: ageLabel });
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <section className="text-center mb-16" aria-labelledby="hero-heading">
          <Badge className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold border-0">
            <Zap className="w-4 h-4 mr-2 inline" aria-hidden="true" />
            100% FREE FOREVER • NO SIGN-UP REQUIRED
          </Badge>

          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-blue-600" aria-hidden="true" />
            <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
              Baby Face Visualizer
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-slate-700 mb-4 font-semibold">
            The #1 AI-Powered Baby Image Generator
          </p>

          <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Transform baby names into stunning photorealistic images with advanced AI technology.
            Watch them grow from baby to adult instantly – completely free, no strings attached!
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
              <span className="text-slate-700 font-semibold text-sm md:text-base">50,000+ Parents Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0" aria-hidden="true" />
              <span className="text-slate-700 font-semibold text-sm md:text-base">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
              <span className="text-slate-700 font-semibold text-sm md:text-base">Award-Winning Technology</span>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-slate-200 hover:border-blue-600 transition-colors duration-300 bg-white shadow-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Photorealistic AI</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Industry-leading AI generates incredibly lifelike baby images that look professionally photographed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-blue-600 transition-colors duration-300 bg-white shadow-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-emerald-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Instant Results</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Get your baby's image in seconds with lightning-fast processing. No waiting around!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-blue-600 transition-colors duration-300 bg-white shadow-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-amber-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Age Progression</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Watch your baby grow through 4 life stages – baby, child, teen, and adult
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 rounded-xl p-8 md:p-10 mb-16 text-white text-center shadow-lg" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="text-2xl md:text-3xl font-bold mb-4">Try It Now – Absolutely Free!</h2>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of parents who've already visualized their baby's future. No credit card, no email, no catch!
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">No Sign-Up</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">Unlimited Uses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">Instant Results</span>
            </div>
          </div>
        </section>

        {/* Main Generator Section */}
        <section className="mb-16" aria-labelledby="generator-heading">
          <h2 id="generator-heading" className="sr-only">Baby Image Generator</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Input and Controls */}
            <div className="space-y-6">
              <Card className="border-2 border-slate-200 shadow-md bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-slate-900">Create Your Baby Image</CardTitle>
                  <CardDescription className="text-base text-slate-600">
                    Enter a baby name to generate a unique, photorealistic image powered by cutting-edge AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Baby's Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter a name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && name.trim() && generateBabyImage()}
                      disabled={loading}
                      className="h-12 text-lg border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      aria-describedby="name-help"
                    />
                    <p id="name-help" className="text-sm text-slate-500">Press Enter to generate</p>
                  </div>

                  <Button
                    onClick={generateBabyImage}
                    disabled={loading || !name.trim()}
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                    aria-label="Generate baby image"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
                        Generate Baby
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Age Progression */}
              {imageId && (
                <Card className="border-2 border-slate-200 shadow-md bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-slate-900">Age Progression</CardTitle>
                    <CardDescription className="text-slate-600">
                      See how {name} looks at different ages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {AGE_GROUPS.map((ageGroup) => (
                        <Button
                          key={ageGroup.id}
                          onClick={() => changeAge(ageGroup.id)}
                          disabled={ageLoading[ageGroup.id] || selectedAge === ageGroup.id}
                          className={`h-14 font-semibold transition-all ${
                            selectedAge === ageGroup.id
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600'
                              : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400'
                          }`}
                          aria-label={`View ${ageGroup.label} stage`}
                          aria-pressed={selectedAge === ageGroup.id}
                        >
                          {ageLoading[ageGroup.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-slate-900">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={downloadImage}
                      disabled={downloadLoading}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                      aria-label="Download baby image"
                    >
                      {downloadLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                          Download Image
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={regenerate}
                      className="w-full h-12 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-semibold"
                      aria-label="Start over with new name"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" aria-hidden="true" />
                      Start Over
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Image Display */}
            <div>
              <Card className="h-full border-2 border-slate-200 shadow-md bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-slate-900">
                    {imageId ? `${name} - ${AGE_GROUPS.find(a => a.id === selectedAge)?.ageText}` : 'Preview'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert className="mb-4 border-2 border-red-300 bg-red-50">
                      <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                    </Alert>
                  )}

                  {currentImage ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm">
                        <img
                          src={`data:image/jpeg;base64,${currentImage}`}
                          alt={`${name} as ${AGE_GROUPS.find(a => a.id === selectedAge)?.label}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-slate-500 text-center leading-relaxed">
                        Click an age button to see {name} at different life stages
                      </p>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <div className="text-center text-slate-400 p-8">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-40" aria-hidden="true" />
                        <p className="text-lg font-medium">Enter a name and click generate to see your baby</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-16" aria-labelledby="testimonials-heading">
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
            What Parents Are Saying
          </h2>
          <p className="text-center text-slate-600 mb-12 text-base md:text-lg">
            Real reviews from thousands of satisfied users
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4" role="img" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-4 italic leading-relaxed">
                  "This is absolutely incredible! The age progression feature is genius!"
                </blockquote>
                <p className="font-semibold text-slate-900">Sarah M.</p>
                <p className="text-sm text-slate-500">Expecting Mother</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4" role="img" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-4 italic leading-relaxed">
                  "The AI quality is outstanding, and it's completely free!"
                </blockquote>
                <p className="font-semibold text-slate-900">Michael T.</p>
                <p className="text-sm text-slate-500">New Parent</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4" role="img" aria-label="5 star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-4 italic leading-relaxed">
                  "The results were so professional and beautiful. Highly recommend!"
                </blockquote>
                <p className="font-semibold text-slate-900">Emily & James R.</p>
                <p className="text-sm text-slate-500">Parents-to-be</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-white rounded-xl p-8 md:p-10 mb-16 shadow-lg border-2 border-slate-200" aria-labelledby="why-choose-heading">
          <h2 id="why-choose-heading" className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
            Why Baby Face Visualizer?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">State-of-the-Art AI Technology</h3>
                <p className="text-slate-600 leading-relaxed">
                  We use the latest AI models to generate photorealistic images that look like professional baby photos, not cartoons or sketches.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Completely Free Forever</h3>
                <p className="text-slate-600 leading-relaxed">
                  No hidden fees, no subscriptions, no premium tiers. We believe every parent should have access to this amazing technology at no cost.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Privacy First</h3>
                <p className="text-slate-600 leading-relaxed">
                  No account required, no personal data collected. Generate images anonymously and download them instantly to your device.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Unique Age Progression</h3>
                <p className="text-slate-600 leading-relaxed">
                  See your baby at 4 different life stages – baby, child, teen, and adult. Perfect for sharing with family or keeping as a keepsake.
                </p>
              </div>
            </div>
          </div>
        </section>

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
        <div className="text-center mt-12 text-slate-500 text-sm space-y-3">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="font-bold text-emerald-700 text-lg mb-2">
              ✓ Always 100% FREE
            </p>
            <p className="text-slate-600">
              No subscriptions, no hidden fees, no credit card required. This tool will always remain completely free for everyone to use.
            </p>
          </div>
          <p className="font-semibold text-slate-700 text-base">
            Powered by Advanced AI Technology • Trusted by Parents Worldwide
          </p>
          <p>
            Generate unlimited photorealistic baby images with age progression • Optional account for saving images
          </p>
        </div>
      </div>
    </div>
  );
}