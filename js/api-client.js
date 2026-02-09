/**
 * API Client Module
 * Handles all server-side API calls to replace localStorage
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('authToken') || null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getToken() {
        return this.token;
    }

    async request(method, endpoint, data = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const options = {
            method,
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`[API] ${method} ${endpoint}`, data);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: response.statusText };
                }
                console.error(`[API Error] ${method} ${endpoint}:`, response.status, errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            if (response.status === 204) {
                return null; // No content response
            }

            const result = await response.json();
            console.log(`[API Success] ${method} ${endpoint}`, result);
            return result;
        } catch (error) {
            console.error(`[API Error] ${method} ${endpoint}:`, error);
            throw error;
        }
    }

    // ==================== Authentication ====================

    async login(username, password) {
        try {
            console.log('[ApiClient] Attempting login for:', username);
            const response = await this.request('POST', '/login', { username, password });
            console.log('[ApiClient] Login response:', response);
            
            if (!response.token) {
                throw new Error('No token received from server');
            }
            
            this.setToken(response.token);
            console.log('[ApiClient] Token stored:', response.token.substring(0, 20) + '...');
            return response.user;
        } catch (error) {
            console.error('[ApiClient] Login error:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    isAuthenticated() {
        return this.token !== null;
    }

    // ==================== Users ====================

    async getUsers() {
        return this.request('GET', '/users');
    }

    async createUser(userData) {
        return this.request('POST', '/users', userData);
    }

    async updateUser(userId, userData) {
        return this.request('PUT', `/users/${userId}`, userData);
    }

    async deleteUser(userId) {
        return this.request('DELETE', `/users/${userId}`);
    }

    // ==================== Departments ====================

    async getDepartments() {
        return this.request('GET', '/departments');
    }

    async getDepartment(deptId) {
        return this.request('GET', `/departments/${deptId}`);
    }

    // ==================== Requirements ====================

    async updateRequirement(deptId, reqId, data) {
        return this.request('PUT', `/departments/${deptId}/requirements/${reqId}`, data);
    }

    // ==================== Files ====================

    /**
     * Upload files for a requirement
     * @param {number} deptId - Department ID
     * @param {number} reqId - Requirement ID
     * @param {File[]} fileList - Array of File objects from input element
     * @returns {Promise} Upload result with file details
     */
    async uploadFiles(deptId, reqId, fileList) {
        return this.uploadFilesAsBase64(deptId, reqId, fileList);
    }

    /**
     * Upload files as base64 (legacy/fallback method)
     * @param {number} deptId - Department ID
     * @param {number} reqId - Requirement ID
     * @param {File[]} fileList - Array of File objects
     * @returns {Promise} Upload result
     */
    async uploadFilesAsBase64(deptId, reqId, fileList) {
        const files = [];
        
        console.log(`[API] Converting ${fileList.length} files to base64...`);
        
        for (const file of Array.from(fileList || [])) {
            try {
                const data = await this.fileToBase64(file);
                console.log(`[API] File ${file.name} converted - size: ${data.length}`);
                files.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: data
                });
            } catch (error) {
                console.error(`[API Error] Failed to convert file ${file.name}:`, error);
                throw new Error(`Failed to process file ${file.name}: ${error.message}`);
            }
        }

        console.log(`[API] Uploading ${files.length} files, total data size: ${files.reduce((sum, f) => sum + f.data.length, 0)} bytes`);
        return this.request('POST', `/departments/${deptId}/requirements/${reqId}/files`, { files });
    }

    /**
     * Convert File to base64 string
     * @private
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('File is null or undefined'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                console.log(`[API] Converted ${file.name} - base64 length: ${base64.length}`);
                resolve(base64);
            };
            reader.onerror = () => {
                reject(new Error(`FileReader error: ${reader.error}`));
            };
            reader.onabort = () => {
                reject(new Error('FileReader aborted'));
            };
            reader.readAsDataURL(file);
        });
    }

    async deleteFile(deptId, reqId, fileId) {
        return this.request('DELETE', `/departments/${deptId}/requirements/${reqId}/files/${fileId}`);
    }

    /**
     * Get files for a requirement
     */
    async getRequirementFiles(deptId, reqId) {
        return this.request('GET', `/departments/${deptId}/requirements/${reqId}/files`);
    }

    // ==================== Activities ====================

    async getActivities(departmentId = null) {
        let endpoint = '/activities';
        if (departmentId) {
            endpoint += `?departmentId=${departmentId}`;
        }
        return this.request('GET', endpoint);
    }

    // ==================== Folder Configuration ====================

    async getFolderConfig() {
        return this.request('GET', '/folder-config');
    }

    async updateFolderConfig(deptId, config) {
        return this.request('PUT', `/folder-config/${deptId}`, config);
    }

    // ==================== Statistics ====================

    async getStatistics() {
        return this.request('GET', '/statistics');
    }
}

// Create global API client instance
const apiClient = new ApiClient();
