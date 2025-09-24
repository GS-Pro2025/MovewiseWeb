import Cookies from 'js-cookie';
import { 
  UserProfile, 
  UpdateProfileRequest, 
  IProfileRepository 
} from '../domain/ProfileDomain';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

export class ProfileApiRepository implements IProfileRepository {
  private getAuthHeaders(): HeadersInit {
    const token = Cookies.get('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use a generic message
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          // Token expired or invalid
          Cookies.remove('authToken');
          window.dispatchEvent(new Event('sessionExpired'));
          throw new Error('Session expired. Please login again.');
        case 403:
          throw new Error('You do not have permission to perform this action.');
        case 404:
          throw new Error('Profile not found.');
        case 422:
          throw new Error('Invalid data provided. Please check your inputs.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorMessage);
      }
    }

    return await response.json();
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${BASE_URL_API}/profile/`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleApiResponse<UserProfile>(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${BASE_URL_API}/profile/`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleApiResponse<UserProfile>(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

// Factory function to create repository instance
export const createProfileRepository = (): IProfileRepository => {
  return new ProfileApiRepository();
};

// Export repository instance for direct use
export const profileRepository = createProfileRepository();