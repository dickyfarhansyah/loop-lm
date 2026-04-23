import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 1000 * 60 * 5, // 5 menit
//       retry: (failureCount, error: any) => {
//         if (error.response?.status === 401) return false;
//         return failureCount < 1;
//       },
//       refetchOnWindowFocus: false,
//     },
//   },
  
//   // Menangani error dari semua useQuery secara terpusat
//   queryCache: new QueryCache({
//     onError: (error: any) => {
//       // Jika refresh token gagal dan melempar 401
//       if (error.response?.status === 401) {
//         handleGlobalLogout();
//       }
//     },
//   }),

//   // Menangani error dari semua useMutation (POST/PUT/DELETE)
//   mutationCache: new MutationCache({
//     onError: (error: any) => {
//       if (error.response?.status === 401) {
//         handleGlobalLogout();
//       }
//     },
//   }),
// })

// // Helper function agar kodenya DRY (Don't Repeat Yourself)
// function handleGlobalLogout() {
//   console.warn("Terminal 401 detected. Clearing all application state...")
  
//   // 1. Hapus SEMUA data dari memory (cache)
//   queryClient.clear();

//   // 2. [Opsional] Redirect paksa ke login jika diperlukan
//   // window.location.href = "/auth/signin";
// }