import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  company_id: string;
}

const Geofences = () => {
  const { user } = useSupabaseAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const circles = useRef<L.Circle[]>([]);

  // Redirect if not admin (only after role is loaded)
  useEffect(() => {
    if (user && !roleLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    fetchCompanyAndGeofences();
  }, [user]);

  useEffect(() => {
    // Wait for container to be fully rendered
    const timer = setTimeout(() => {
      if (mapContainer.current && !map.current && !roleLoading) {
        console.log('Initializing map...');
        initializeMap();
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [roleLoading]);

  useEffect(() => {
    if (map.current && geofences.length > 0) {
      updateMapMarkers(geofences);
    }
  }, [geofences]);

  const fetchCompanyAndGeofences = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        await fetchGeofences(profile.company_id);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeofences = async (company_id: string) => {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('company_id', company_id);

    if (error) {
      toast.error('Failed to load geofences');
      return;
    }

    setGeofences(data || []);
  };

  const initializeMap = () => {
    if (!mapContainer.current || map.current) {
      console.log('Map already initialized or container not ready');
      return;
    }

    try {
      console.log('Creating map instance...');
      console.log('Container dimensions:', mapContainer.current.offsetWidth, mapContainer.current.offsetHeight);
      
      // Initialize map with OpenStreetMap tiles
      map.current = L.map(mapContainer.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        preferCanvas: true,
      });

      console.log('Adding tile layer...');
      // Add OpenStreetMap tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
      });
      
      tileLayer.on('tileerror', (error) => {
        console.error('Tile loading error:', error);
      });
      
      tileLayer.addTo(map.current);

      console.log('Map initialized successfully');
      
      // Force map to recalculate size multiple times to ensure proper rendering
      const invalidateSizes = [100, 300, 500];
      invalidateSizes.forEach(delay => {
        setTimeout(() => {
          if (map.current) {
            map.current.invalidateSize();
            console.log(`Map size invalidated after ${delay}ms`);
          }
        }, delay);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map');
      return;
    }

    // Add click event to set geofence location
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      setNewGeofence(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
      
      // Add temporary marker
      if (map.current) {
        markers.current.forEach(m => m.remove());
        circles.current.forEach(c => c.remove());
        
        const tempMarker = L.marker([e.latlng.lat, e.latlng.lng], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        }).addTo(map.current);
        
        const tempCircle = L.circle([e.latlng.lat, e.latlng.lng], {
          radius: newGeofence.radius_meters,
          color: '#8B5CF6',
          fillColor: '#8B5CF6',
          fillOpacity: 0.2
        }).addTo(map.current);
        
        markers.current = [...markers.current, tempMarker];
        circles.current = [...circles.current, tempCircle];
        
        // Update existing geofence markers
        geofences.forEach(geofence => {
          const marker = L.marker([geofence.latitude, geofence.longitude]).addTo(map.current!);
          marker.bindPopup(`<strong>${geofence.name}</strong><br/>Radius: ${geofence.radius_meters}m`);
          
          const circle = L.circle([geofence.latitude, geofence.longitude], {
            radius: geofence.radius_meters,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.2
          }).addTo(map.current!);
          
          markers.current.push(marker);
          circles.current.push(circle);
        });
      }
    });
  };

  const updateMapMarkers = (geofenceList: Geofence[]) => {
    if (!map.current) return;

    // Clear existing markers and circles
    markers.current.forEach(marker => marker.remove());
    circles.current.forEach(circle => circle.remove());
    markers.current = [];
    circles.current = [];

    // Add markers and circles for each geofence
    geofenceList.forEach(geofence => {
      const marker = L.marker([geofence.latitude, geofence.longitude]).addTo(map.current!);
      marker.bindPopup(`<strong>${geofence.name}</strong><br/>Radius: ${geofence.radius_meters}m`);
      
      const circle = L.circle([geofence.latitude, geofence.longitude], {
        radius: geofence.radius_meters,
        color: '#8B5CF6',
        fillColor: '#8B5CF6',
        fillOpacity: 0.2
      }).addTo(map.current!);
      
      markers.current.push(marker);
      circles.current.push(circle);
    });

    // Fit map to show all geofences
    if (geofenceList.length > 0) {
      const bounds = L.latLngBounds(
        geofenceList.map(g => [g.latitude, g.longitude] as [number, number])
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleCreateGeofence = async () => {
    if (!companyId || !newGeofence.name) {
      toast.error('Please provide a name and select location on map');
      return;
    }

    if (newGeofence.latitude === 0 && newGeofence.longitude === 0) {
      toast.error('Please click on the map to set a location');
      return;
    }

    const { error } = await supabase
      .from('geofences')
      .insert({
        ...newGeofence,
        company_id: companyId
      });

    if (error) {
      toast.error('Failed to create geofence');
      return;
    }

    toast.success('Geofence created successfully');
    setNewGeofence({ name: '', latitude: 0, longitude: 0, radius_meters: 100 });
    
    // Clear temporary markers
    markers.current.forEach(m => m.remove());
    circles.current.forEach(c => c.remove());
    markers.current = [];
    circles.current = [];
    
    fetchGeofences(companyId);
  };

  const handleDeleteGeofence = async (id: string) => {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete geofence');
      return;
    }

    toast.success('Geofence deleted');
    if (companyId) fetchGeofences(companyId);
  };

  const useMyLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setNewGeofence(prev => ({
          ...prev,
          latitude,
          longitude
        }));

        // Center map on user's location
        if (map.current) {
          map.current.setView([latitude, longitude], 16);
          
          // Clear existing temporary markers
          markers.current.forEach(m => m.remove());
          circles.current.forEach(c => c.remove());
          markers.current = [];
          circles.current = [];

          // Add marker at user's location
          const marker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }).addTo(map.current);

          const circle = L.circle([latitude, longitude], {
            radius: newGeofence.radius_meters,
            color: '#8B5CF6',
            fillColor: '#8B5CF6',
            fillOpacity: 0.2
          }).addTo(map.current);

          markers.current.push(marker);
          circles.current.push(circle);

          // Add existing geofences back
          geofences.forEach(geofence => {
            const geoMarker = L.marker([geofence.latitude, geofence.longitude]).addTo(map.current!);
            geoMarker.bindPopup(`<strong>${geofence.name}</strong><br/>Radius: ${geofence.radius_meters}m`);
            
            const geoCircle = L.circle([geofence.latitude, geofence.longitude], {
              radius: geofence.radius_meters,
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.2
            }).addTo(map.current!);
            
            markers.current.push(geoMarker);
            circles.current.push(geoCircle);
          });
        }

        toast.success('Location acquired successfully');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location. Please check permissions.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extralight tracking-wider text-foreground mb-2">Geofence Setup</h1>
        <p className="text-muted-foreground font-light tracking-wide">
          Set office boundaries for attendance verification using OpenStreetMap
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-light tracking-wide flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map View
            </CardTitle>
            <CardDescription className="font-light">
              Click on the map to set geofence location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapContainer} 
              className="w-full h-[500px] rounded-lg border bg-muted/10" 
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-light tracking-wide flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Geofence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={useMyLocation} 
                disabled={gettingLocation}
                variant="outline" 
                className="w-full font-light tracking-wide"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gettingLocation ? 'Getting Location...' : 'Use My Location'}
              </Button>
              
              <div>
                <Label htmlFor="name" className="font-light">Location Name</Label>
                <Input
                  id="name"
                  value={newGeofence.name}
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Office"
                  className="font-light"
                />
              </div>
              <div>
                <Label htmlFor="radius" className="font-light">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={newGeofence.radius_meters}
                  onChange={(e) => {
                    const radius = parseInt(e.target.value) || 100;
                    setNewGeofence(prev => ({ ...prev, radius_meters: radius }));
                    
                    // Update circle radius if exists
                    if (circles.current.length > 0 && map.current) {
                      circles.current.forEach(c => c.remove());
                      circles.current = [];
                      
                      if (newGeofence.latitude !== 0 || newGeofence.longitude !== 0) {
                        const circle = L.circle([newGeofence.latitude, newGeofence.longitude], {
                          radius: radius,
                          color: '#8B5CF6',
                          fillColor: '#8B5CF6',
                          fillOpacity: 0.2
                        }).addTo(map.current);
                        circles.current.push(circle);
                      }
                    }
                  }}
                  className="font-light"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-light text-xs">Latitude</Label>
                  <Input
                    value={newGeofence.latitude === 0 ? 'Click map' : newGeofence.latitude.toFixed(6)}
                    readOnly
                    className="font-light text-xs"
                  />
                </div>
                <div>
                  <Label className="font-light text-xs">Longitude</Label>
                  <Input
                    value={newGeofence.longitude === 0 ? 'Click map' : newGeofence.longitude.toFixed(6)}
                    readOnly
                    className="font-light text-xs"
                  />
                </div>
              </div>
              <Button onClick={handleCreateGeofence} className="w-full font-light tracking-wide">
                Create Geofence
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-light tracking-wide">Active Geofences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {geofences.length === 0 ? (
                <p className="text-sm text-muted-foreground font-light">No geofences configured</p>
              ) : (
                geofences.map((geofence) => (
                  <div
                    key={geofence.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-light tracking-wide">{geofence.name}</p>
                      <p className="text-xs text-muted-foreground font-light">
                        {geofence.radius_meters}m radius
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGeofence(geofence.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Geofences;
