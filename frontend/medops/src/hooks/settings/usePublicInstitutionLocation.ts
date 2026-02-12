import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
interface LocationData {
  name: string;
  location: {
    neighborhood: string | null;
    parish: string | null;
    municipality: string | null;
    state: string | null;
    country: string | null;
    coordinates: string;
  };
  timezone: string;
  status: string;
}
export function usePublicInstitutionLocation() {
  return useQuery<LocationData>({
    queryKey: ['public', 'institution', 'location'],
    queryFn: async () => {
      const res = await api.get<LocationData>('public/institution/location/');
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos - datos raramente cambian
  });
}