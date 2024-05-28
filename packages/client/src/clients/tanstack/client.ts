import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    // queries: {
    //   staleTime: 1000 * 10,
    //   gcTime: 1000 * 60 * 60 * 24,
    //   retry: 5,
    // },
  },
});
