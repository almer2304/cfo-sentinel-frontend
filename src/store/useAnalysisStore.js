import { create } from "zustand"

const useAnalysisStore = create((set) => ({
  result:    null,
  isLoading: false,
  error:     null,

  setResult:    (result)    => set({ result, isLoading: false, error: null }),
  setLoading:   (isLoading) => set({ isLoading }),
  setError:     (error)     => set({ error, isLoading: false }),
  clearResult:  ()          => set({ result: null, error: null }),
}))

export default useAnalysisStore
