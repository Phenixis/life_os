"use client"

import { useFilteredData } from "../use-filtered-data"
import { ApiClient } from "@/lib/api-client"
import { useUser } from "../use-user"
import { Ai } from "@/lib/db/schema"
import type { CreateProfileRequest } from "@/lib/types/chat"

// Type for the API response structure
interface ProfilesApiResponse {
  profiles: Ai.Profile.Select[]
}

interface UseProfilesParams {
  skipFetch?: boolean
}

export function useProfiles(params: UseProfilesParams = {}) {
  const { skipFetch = false } = params
  const { user } = useUser()

  const {
    data: profilesData,
    isLoading,
    isError,
    mutate,
  } = useFilteredData<ProfilesApiResponse>({
    endpoint: "/api/profiles",
    skipFetch: !user?.api_key || skipFetch,
  })

  const profiles = (profilesData?.profiles || []) as Ai.Profile.Select[]

  const createProfile = async (data: CreateProfileRequest) => {
    if (!user?.api_key) throw new Error("No API key available")

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.createProfile(data)

      // Optimistically add to local state
      const newProfile = result.profile
      const optimisticProfiles = [...profiles, newProfile]
      mutate({ profiles: optimisticProfiles }, false)

      // Revalidate to ensure consistency
      await mutate()

      return result
    } catch (error) {
      // Revalidate on error to ensure consistency
      await mutate()
      throw error
    }
  }

  const updateProfile = async (profileId: string, data: Partial<Ai.Profile.Select>) => {
    if (!user?.api_key) throw new Error("No API key available")

    // Optimistically update local state
    const optimisticProfiles = profiles.map(profile => 
      profile.id === profileId 
        ? { ...profile, ...data, updated_at: new Date() }
        : profile
    )
    
    mutate({ profiles: optimisticProfiles }, false)

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.updateProfile(profileId, data)
      
      // Revalidate to ensure consistency
      await mutate()
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      await mutate()
      throw error
    }
  }

  const deleteProfile = async (profileId: string) => {
    if (!user?.api_key) throw new Error("No API key available")

    // Optimistically remove from local state
    const optimisticProfiles = profiles.filter(profile => profile.id !== profileId)
    mutate({ profiles: optimisticProfiles }, false)

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.deleteProfile(profileId)
      
      // Revalidate to ensure consistency
      await mutate()
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      await mutate()
      throw error
    }
  }

  return {
    data: profiles,
    isLoading,
    isError,
    profiles, // Keep backward compatibility
    createProfile,
    updateProfile,
    deleteProfile,
    mutate,
  }
}
