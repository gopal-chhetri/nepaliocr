import { useQuery } from '@tanstack/react-query'
import { getDailyUsage } from '@/lib/storage-api'

export function useDailyUsage(enabled = true) {
  return useQuery({
    queryKey: ['daily-usage'],
    queryFn: getDailyUsage,
    enabled,
    staleTime: 10000,
    retry: false,
  })
}