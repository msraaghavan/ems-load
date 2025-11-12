import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2 } from 'lucide-react';

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
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    radius_meters: 100
  });
  const [mapboxToken, setMapboxToken] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    fetchCompanyAndGeofences();
  }, [user]);

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

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
    if (data && data.length > 0 && map.current) {
      updateMapMarkers(data);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 0],
      zoom: 2
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('click', (e) => {
      setNewGeofence(prev => ({
        ...prev,
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng
      }));
    });

    if (geofences.length > 0) {
      updateMapMarkers(geofences);
    }
  };

  const updateMapMarkers = (geofenceList: Geofence[]) => {
    if (!map.current) return;

    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    geofenceList.forEach(geofence => {
      const marker = new mapboxgl.Marker({ color: '#8B5CF6' })
        .setLngLat([geofence.longitude, geofence.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${geofence.name}</strong><br/>Radius: ${geofence.radius_meters}m`
          )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    if (geofenceList.length > 0) {
      map.current.flyTo({
        center: [geofenceList[0].longitude, geofenceList[0].latitude],
        zoom: 15
      });
    }
  };

  const handleCreateGeofence = async () => {
    if (!companyId || !newGeofence.name) {
      toast.error('Please provide a name and select location on map');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-light tracking-wide">Mapbox Token Required</CardTitle>
            <CardDescription className="font-light">
              Enter your Mapbox public token to use the map interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mapbox-token" className="font-light">Mapbox Public Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1..."
                onChange={(e) => setMapboxToken(e.target.value)}
                className="font-light"
              />
              <p className="text-xs text-muted-foreground mt-2 font-light">
                Get your token from{' '}
                <a
                  href="https://account.mapbox.com/access-tokens/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extralight tracking-wider text-foreground mb-2">Geofence Setup</h1>
        <p className="text-muted-foreground font-light tracking-wide">
          Set office boundaries for attendance verification
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
            <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
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
                  onChange={(e) => setNewGeofence(prev => ({ ...prev, radius_meters: parseInt(e.target.value) }))}
                  className="font-light"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="font-light text-xs">Latitude</Label>
                  <Input
                    value={newGeofence.latitude.toFixed(6)}
                    readOnly
                    className="font-light text-xs"
                  />
                </div>
                <div>
                  <Label className="font-light text-xs">Longitude</Label>
                  <Input
                    value={newGeofence.longitude.toFixed(6)}
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
