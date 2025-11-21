import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Key, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanySetup() {
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { user, isAuthenticated } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    checkUserCompany();

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, [isAuthenticated, navigate, user]);

  const checkUserCompany = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profile?.company_id) {
      setHasCompany(true);
      navigate('/dashboard');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!facePhoto) {
      toast({
        variant: 'destructive',
        title: 'Photo required',
        description: 'Please capture your face photo for security verification',
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: { name: companyName, facePhoto },
      });

      if (error) throw error;

      toast({
        title: 'Company created!',
        description: `${companyName} has been created successfully`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Camera access denied',
        description: 'Please allow camera access to capture your photo for security verification',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFacePhoto(dataUrl);
        stopCamera();
        toast({
          title: 'Photo captured!',
          description: 'Your face photo has been captured for security verification',
        });
      }
    }
  };

  const retakePhoto = () => {
    setFacePhoto(null);
    startCamera();
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!facePhoto) {
      toast({
        variant: 'destructive',
        title: 'Photo required',
        description: 'Please capture your face photo for security verification',
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('join-company', {
        body: { code: inviteCode, facePhoto },
      });

      if (error) throw error;

      toast({
        title: 'Joined company!',
        description: `Welcome to ${data.company?.name}`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to join company',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-extralight tracking-wider">Company Setup</h1>
            <p className="text-muted-foreground mt-3 font-light tracking-wide">
              Create a new company or join an existing one
            </p>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-light tracking-wide">Get Started</CardTitle>
            <CardDescription className="font-light">
              Choose how you'd like to proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 font-light mb-6">
                <TabsTrigger value="create">Create Company</TabsTrigger>
                <TabsTrigger value="join">Join Company</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="font-light">
                      Company Name
                    </Label>
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="font-light"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-light">Face Photo (Required for Security)</Label>
                    {!showCamera && !facePhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full font-light"
                        onClick={startCamera}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Face Photo
                      </Button>
                    )}

                    {showCamera && !facePhoto && (
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={stopCamera}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={capturePhoto}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Capture
                          </Button>
                        </div>
                      </div>
                    )}

                    {facePhoto && (
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <img src={facePhoto} alt="Captured face" className="w-full h-full object-cover" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={retakePhoto}
                        >
                          Retake Photo
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-light tracking-wide"
                    size="lg"
                    disabled={loading || !facePhoto}
                  >
                    {loading ? 'Creating...' : 'Create Company'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground font-light">
                    Your face photo is required for secure attendance check-in with geofence and face verification
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form onSubmit={handleJoinCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code" className="font-light">
                      Invite Code
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder="XXXX-XXXX"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="font-light pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-light">Face Photo (Required for Security)</Label>
                    {!showCamera && !facePhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full font-light"
                        onClick={startCamera}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Face Photo
                      </Button>
                    )}

                    {showCamera && !facePhoto && (
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={stopCamera}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={capturePhoto}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Capture
                          </Button>
                        </div>
                      </div>
                    )}

                    {facePhoto && (
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <img src={facePhoto} alt="Captured face" className="w-full h-full object-cover" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={retakePhoto}
                        >
                          Retake Photo
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-light tracking-wide"
                    size="lg"
                    disabled={loading || !facePhoto}
                  >
                    {loading ? 'Joining...' : 'Join Company'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground font-light">
                    Your face photo is required for secure attendance check-in with geofence and face verification
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
