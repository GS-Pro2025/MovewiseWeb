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

    /**
     * Lists all jobs.
     * @returns A promise that resolves to an array of JobModel.
     */
    async listJobs(): Promise<JobModel[]> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/jobs/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error fetching jobs: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Creates a new job.
     * @param name The name of the job.
     * @returns A promise that resolves to the created JobModel.
     */
    async createJob(name: string): Promise<JobModel> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/jobs/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error creating job: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Deletes a job (PATCH request).
     * @param id The ID of the job to delete.
     * @returns A promise that resolves when the deletion is successful.
     */
    async deleteJob(id: number): Promise<void> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/job/${id}/delete/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

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
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/jobs/${id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error editing job: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Retrieves a list of tools associated with a specific job, in a paginated format.
     * @param jobId The ID of the job to retrieve tools for.
     * @returns A promise that resolves to a PaginatedToolsResponse.
     */
    async listToolsByJob(jobId: number): Promise<PaginatedToolsResponse> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/toolsByJob/${jobId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error fetching tools: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Creates a new tool.
     * @param name The name of the tool.
     * @param jobId The ID of the job to associate with the tool.
     * @returns A promise that resolves to the created ToolModel.
     */
    async createTool(name: string, jobId: number): Promise<ToolModel> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/tools/create/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, job: jobId }),
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (!response.ok) {
            throw new Error(`Error creating tool: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Deletes a tool (performs a PATCH request to mark as deleted).
     * @param id The ID of the tool to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    async deleteTool(id: number): Promise<void> {
        const token = Cookies.get('authToken');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${this.baseUrl}/tools/${id}/delete/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            Cookies.remove('authToken');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        if (response.status === 204 || response.status === 200) {
            return;
        }

        throw new Error('Error al eliminar la herramienta');
    }
}

// Create singleton instance
export const jobsAndToolRepository = new JobsAndToolRepository();