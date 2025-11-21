import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Camera, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface AttendanceCheckInDialogProps {
  onSuccess: () => void;
  companyId: string;
}

export function AttendanceCheckInDialog({ onSuccess, companyId }: AttendanceCheckInDialogProps) {
  const { user } = useSupabaseAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'capture' | 'verifying' | 'done'>('capture');
  const [imageData, setImageData] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open && step === 'capture') {
      startCamera();
      getLocation();
    }
    return () => {
      stopCamera();
    };
  }, [open, step]);

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
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location. Please enable location services.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
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
        setImageData(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setImageData(null);
    setStep('capture');
  };

  const handleCheckIn = async () => {
    if (!user || !imageData || !location) {
      toast.error('Missing required data');
      return;
    }

    setLoading(true);
    setStep('verifying');

    try {
      // Validate geofence
      const { data: geofenceData, error: geofenceError } = await supabase.functions.invoke('validate-geofence', {
        body: {
          latitude: location.latitude,
          longitude: location.longitude,
          company_id: companyId
        }
      });

      if (geofenceError) throw geofenceError;

      if (!geofenceData?.withinGeofence) {
        toast.error('You are outside the allowed work location');
        setLoading(false);
        setStep('capture');
        return;
      }

      // Verify face
      const { data: faceData, error: faceError } = await supabase.functions.invoke('verify-face', {
        body: {
          photo_data: imageData,
          user_id: user.id,
          company_id: companyId
        }
      });

      if (faceError) throw faceError;

      if (!faceData?.verified) {
        toast.error('Face verification failed. Please try again.');
        setLoading(false);
        setStep('capture');
        return;
      }

      // Create attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          company_id: companyId,
          date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toISOString(),
          check_in_location_lat: location.latitude,
          check_in_location_lng: location.longitude,
          check_in_photo_url: imageData,
          status: 'present'
        });

      if (attendanceError) throw attendanceError;

      toast.success('Check-in successful!');
      setStep('done');
      setOpen(false);
      onSuccess();
      
      // Reset state
      setTimeout(() => {
        setImageData(null);
        setLocation(null);
        setStep('capture');
      }, 500);
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in. Please try again.');
      setStep('capture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Clock className="w-4 h-4" />
          Check In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Check In Attendance</DialogTitle>
          <DialogDescription>
            Capture your photo and verify your location to check in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'capture' && !imageData && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {location ? (
                  <span>Location detected</span>
                ) : (
                  <span>Detecting location...</span>
                )}
              </div>

              <Button 
                onClick={capturePhoto} 
                className="w-full gap-2"
                disabled={!location}
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </Button>
            </div>
          )}

          {step === 'capture' && imageData && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img src={imageData} alt="Captured" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-2">
                <Button onClick={retakePhoto} variant="outline" className="flex-1">
                  Retake
                </Button>
                <Button onClick={handleCheckIn} className="flex-1" disabled={loading}>
                  Check In
                </Button>
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Verifying your identity and location...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
