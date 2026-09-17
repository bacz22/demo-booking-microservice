import { apiClient } from '@/lib/api-client'

export interface MediaUploadResult {
  resourceType: string
  publicId: string
  url: string
  secureUrl: string
  format: string
  bytes: number
  width?: number
  height?: number
  duration?: number
}

export const mediaApiService = {
  /**
   * Upload tệp hình ảnh lên hệ thống Media qua Backend
   */
  async uploadImage(file: File): Promise<MediaUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.postForm<MediaUploadResult>('/admin/media/image', formData)
  },

  /**
   * Upload tệp video lên hệ thống Media qua Backend
   */
  async uploadVideo(file: File): Promise<MediaUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.postForm<MediaUploadResult>('/admin/media/video', formData)
  },
}

export default mediaApiService
