import Cookies from 'js-cookie';

// Define the interfaces for Job and Tool models
export interface JobModel {
    id: number;
    name: string;
}

export interface ToolModel {
    id: number;
    name: string;
    job: number; // Represents the ID of the associated job
}

export interface PaginatedToolsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ToolModel[];
    current_company_id: number; // Based on your example response
}

export interface JobsAndToolRepositoryInterface {
    /**
     * Retrieves a list of all available jobs.
     * @returns A promise that resolves to an array of JobModel.
     */
    listJobs(): Promise<JobModel[]>;

    /**
     * Creates a new job.
     * @param name The name of the new job.
     * @returns A promise that resolves to the created JobModel.
     */
    createJob(name: string): Promise<JobModel>;

    /**
     * Deletes a job (performs a PATCH request to mark as deleted).
     * @param id The ID of the job to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    deleteJob(id: number): Promise<void>;

    /**
     * Edits an existing job's name.
     * @param id The ID of the job to edit.
     * @param name The new name for the job.
     * @returns A promise that resolves to the updated JobModel.
     */
    editJob(id: number, name: string): Promise<JobModel>;

    /**
     * Retrieves a list of tools associated with a specific job, in a paginated format.
     * @param jobId The ID of the job to retrieve tools for.
     * @returns A promise that resolves to a PaginatedToolsResponse.
     */
    listToolsByJob(jobId: number): Promise<PaginatedToolsResponse>;

    /**
     * Creates a new tool.
     * @param name The name of the new tool.
     * @param jobId The ID of the job to associate the tool with.
     * @returns A promise that resolves to the created ToolModel.
     */
    createTool(name: string, jobId: number): Promise<ToolModel>;

    /**
     * Deletes a tool (performs a PATCH request to mark as deleted).
     * @param id The ID of the tool to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    deleteTool(id: number): Promise<void>;
}

export class JobsAndToolRepository implements JobsAndToolRepositoryInterface {
    private baseUrl: string = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

    
    private async fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
        // Retrieve the authentication token from cookies
        const token = Cookies.get('authToken');
        if (!token) {
            // Redirect to login if no token is found
            window.location.href = '/login';
            throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
        }

        // Set authorization and content-type headers
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers // Allow overriding or adding more headers
        };

        try {
            // Perform the fetch request
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Handle 403 Forbidden status (session expired)
            if (response.status === 403) {
                Cookies.remove('authToken'); // Remove expired token
                window.location.href = '/login'; // Redirect to login
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            // Handle non-OK responses (e.g., 400, 404, 500)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || 'Error en la solicitud');
            }

            return response;
        } catch (error) {
            // Re-throw specific errors or throw a general network error
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error en la solicitud de red');
        }
    }

    /**
     * Lists all jobs.
     * @returns A promise that resolves to an array of JobModel.
     */
    async listJobs(): Promise<JobModel[]> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/jobs/`, {
            method: 'GET',
        });
        return await response.json();
    }

    /**
     * Creates a new job.
     * @param name The name of the job.
     * @returns A promise that resolves to the created JobModel.
     */
    async createJob(name: string): Promise<JobModel> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/jobs/`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
        return await response.json();
    }

    /**
     * Deletes a job (PATCH request).
     * @param id The ID of the job to delete.
     * @returns A promise that resolves when the deletion is successful.
     */
    async deleteJob(id: number): Promise<void> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/job/${id}/delete/`, {
            method: 'PATCH',
        });
        // Check for success status codes for deletion (204 No Content, 200 OK)
        if (response.status === 204 || response.status === 200) {
            return;
        }
        throw new Error('Error al eliminar el job');
    }

    /**
     * Edits an existing job's name.
     * @param id The ID of the job to edit.
     * @param name The new name for the job.
     * @returns A promise that resolves to the updated JobModel.
     */
    async editJob(id: number, name: string): Promise<JobModel> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/jobs/${id}/`, {
            method: 'PATCH', // Use PATCH for partial updates
            body: JSON.stringify({ name }),
        });
        return await response.json();
    }

    /**
     * Retrieves a list of tools associated with a specific job, in a paginated format.
     * @param jobId The ID of the job to retrieve tools for.
     * @returns A promise that resolves to a PaginatedToolsResponse.
     */
    async listToolsByJob(jobId: number): Promise<PaginatedToolsResponse> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/toolsByJob/${jobId}/`, {
            method: 'GET',
        });
        return await response.json();
    }

    /**
     * Creates a new tool.
     * @param name The name of the tool.
     * @param jobId The ID of the job to associate with the tool.
     * @returns A promise that resolves to the created ToolModel.
     */
    async createTool(name: string, jobId: number): Promise<ToolModel> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/tools/create/`, {
            method: 'POST',
            body: JSON.stringify({ name, job: jobId }),
        });
        return await response.json();
    }

    /**
     * Deletes a tool (performs a PATCH request to mark as deleted).
     * @param id The ID of the tool to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    async deleteTool(id: number): Promise<void> {
        const response = await this.fetchWithAuth(`${this.baseUrl}/tools/${id}/delete/`, {
            method: 'PATCH',
        });
        // Check for success status codes for deletion
        if (response.status === 204 || response.status === 200) {
            return;
        }
        throw new Error('Error al eliminar la herramienta');
    }
}
