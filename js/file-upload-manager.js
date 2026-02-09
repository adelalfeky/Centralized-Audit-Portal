/**
 * File Upload Manager Module
 * Handles file uploads for requirements
 */

class FileUploadManager {
    constructor() {
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.maxTotalSize = 500 * 1024 * 1024; // 500MB
        this.allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'text/csv'
        ];
    }

    /**
     * Initialize file upload UI for a requirement
     * @param {string} containerId - ID of the container for file upload UI
     * @param {number} deptId - Department ID
     * @param {number} reqId - Requirement ID
     * @param {Function} onUploadComplete - Callback after upload
     */
    initializeUploadUI(containerId, deptId, reqId, onUploadComplete) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const uploadHTML = `
            <div class="file-upload-section mt-6 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Attach Files</h3>
                    <span class="text-sm text-gray-600">Max 100MB per file, 500MB total</span>
                </div>

                <!-- File Input with Drag & Drop -->
                <div id="file-drop-zone-${reqId}" class="border-2 border-dashed border-blue-400 rounded-lg p-6 bg-white text-center cursor-pointer hover:bg-blue-50 transition">
                    <i class="fas fa-cloud-upload-alt text-4xl text-blue-400 mb-2"></i>
                    <p class="text-gray-700 font-medium mb-2">Drag files here or click to select</p>
                    <p class="text-sm text-gray-500 mb-3">Supported: PDF, Word, Excel, Images, Text</p>
                    <input type="file" id="file-input-${reqId}" class="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv">
                </div>

                <!-- File List -->
                <div id="file-list-${reqId}" class="mt-4">
                    <div id="selected-files-${reqId}" class="space-y-2"></div>
                    <div id="uploaded-files-${reqId}" class="space-y-2 mt-4 pt-4 border-t"></div>
                </div>

                <!-- Upload Progress -->
                <div id="upload-progress-${reqId}" class="mt-4 hidden">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Uploading files...</span>
                        <span id="upload-percent-${reqId}" class="text-sm text-gray-600">0%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="upload-bar-${reqId}" class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Upload Button -->
                <button id="upload-btn-${reqId}" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-gray-400" disabled>
                    <i class="fas fa-upload mr-2"></i>Upload Files
                </button>

                <!-- Messages -->
                <div id="upload-message-${reqId}" class="mt-3"></div>
            </div>
        `;

        container.innerHTML = uploadHTML;

        // Setup event listeners
        this.setupFileInputListeners(deptId, reqId, onUploadComplete);
    }

    /**
     * Setup file input and drag-drop listeners
     * @private
     */
    setupFileInputListeners(deptId, reqId, onUploadComplete) {
        const dropZone = document.getElementById(`file-drop-zone-${reqId}`);
        const fileInput = document.getElementById(`file-input-${reqId}`);
        const uploadBtn = document.getElementById(`upload-btn-${reqId}`);
        const fileList = {};

        // File input click
        dropZone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, deptId, reqId, fileList, uploadBtn);
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-blue-100');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-blue-100');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-blue-100');
            this.handleFileSelection(e.dataTransfer.files, deptId, reqId, fileList, uploadBtn);
        });

        // Upload button
        uploadBtn.addEventListener('click', async () => {
            if (Object.keys(fileList).length === 0) {
                this.showMessage(reqId, 'Please select files first', 'error');
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';

            try {
                await this.uploadFiles(deptId, reqId, fileList, uploadBtn, onUploadComplete);
            } catch (error) {
                console.error('Upload error:', error);
                this.showMessage(reqId, `Upload failed: ${error.message}`, 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload Files';
            }
        });
    }

    /**
     * Handle file selection
     * @private
     */
    handleFileSelection(files, deptId, reqId, fileList, uploadBtn) {
        const selectedFilesDiv = document.getElementById(`selected-files-${reqId}`);
        selectedFilesDiv.innerHTML = '';

        let totalSize = 0;

        for (const file of Array.from(files)) {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showMessage(reqId, validation.error, 'error');
                continue;
            }

            totalSize += file.size;
            fileList[file.name] = file;

            // Add to UI
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between bg-white p-3 rounded border border-gray-200';
            fileItem.innerHTML = `
                <div class="flex items-center flex-1">
                    <i class="fas fa-file text-blue-500 mr-3"></i>
                    <div>
                        <p class="font-medium text-gray-800">${file.name}</p>
                        <p class="text-sm text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button type="button" class="remove-file-btn text-red-500 hover:text-red-700" data-filename="${file.name}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            selectedFilesDiv.appendChild(fileItem);

            // Remove file listener
            fileItem.querySelector('.remove-file-btn').addEventListener('click', () => {
                delete fileList[file.name];
                fileItem.remove();
                uploadBtn.disabled = Object.keys(fileList).length === 0;
            });
        }

        // Update UI
        uploadBtn.disabled = Object.keys(fileList).length === 0;
        if (totalSize > this.maxTotalSize) {
            this.showMessage(reqId, 'Total file size exceeds 500MB limit', 'error');
            Object.keys(fileList).forEach(name => delete fileList[name]);
            uploadBtn.disabled = true;
        } else if (Object.keys(fileList).length > 0) {
            this.showMessage(reqId, `${Object.keys(fileList).length} file(s) selected (${this.formatFileSize(totalSize)})`, 'success');
        }
    }

    /**
     * Validate single file
     * @private
     */
    validateFile(file) {
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File "${file.name}" exceeds 100MB limit`
            };
        }

        if (this.allowedTypes.length > 0 && !this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type "${file.type}" not allowed for "${file.name}"`
            };
        }

        return { valid: true };
    }

    /**
     * Upload files to server
     * @private
     */
    async uploadFiles(deptId, reqId, fileList, uploadBtn, onUploadComplete) {
        const files = Object.values(fileList);
        const progressDiv = document.getElementById(`upload-progress-${reqId}`);
        const progressBar = document.getElementById(`upload-bar-${reqId}`);
        const progressPercent = document.getElementById(`upload-percent-${reqId}`);

        progressDiv.classList.remove('hidden');

        try {
            // Use FormData for binary file upload
            const result = await apiClient.uploadFiles(deptId, reqId, files);

            console.log('Upload result:', result);

            // Show uploaded files
            this.displayUploadedFiles(reqId, result.uploadedFiles || result);

            // Show success message
            this.showMessage(reqId, `Successfully uploaded ${files.length} file(s)`, 'success');

            // Clear file list
            Object.keys(fileList).forEach(key => delete fileList[key]);
            document.getElementById(`file-input-${reqId}`).value = '';
            document.getElementById(`selected-files-${reqId}`).innerHTML = '';

            // Callback
            if (onUploadComplete) {
                onUploadComplete(result);
            }

            return result;
        } finally {
            progressDiv.classList.add('hidden');
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
        }
    }

    /**
     * Display uploaded files
     * @private
     */
    displayUploadedFiles(reqId, uploadedFiles) {
        const uploadedDiv = document.getElementById(`uploaded-files-${reqId}`);
        uploadedDiv.innerHTML = '<p class="text-sm font-semibold text-gray-700 mb-2">Uploaded Files:</p>';

        uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between bg-green-50 p-3 rounded border border-green-200';
            fileItem.innerHTML = `
                <div class="flex items-center flex-1">
                    <i class="fas fa-check-circle text-green-600 mr-3"></i>
                    <div>
                        <p class="font-medium text-gray-800">${file.name}</p>
                        <p class="text-xs text-gray-500">
                            ${this.formatFileSize(file.size)} • Uploaded: ${new Date(file.uploaded).toLocaleString()}
                        </p>
                    </div>
                </div>
                <button type="button" class="delete-file-btn text-red-500 hover:text-red-700" data-fileid="${file.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            uploadedDiv.appendChild(fileItem);
        });
    }

    /**
     * Show upload message
     * @private
     */
    showMessage(reqId, message, type = 'info') {
        const messageDiv = document.getElementById(`upload-message-${reqId}`);
        const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
                       type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
                       'bg-blue-50 border-blue-200 text-blue-700';

        messageDiv.innerHTML = `
            <div class="border rounded-lg p-3 ${bgColor}">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
                ${message}
            </div>
        `;

        setTimeout(() => {
            if (messageDiv) {
                messageDiv.innerHTML = '';
            }
        }, 5000);
    }

    /**
     * Format file size in human readable format
     * @private
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Create global file upload manager instance
const fileUploadManager = new FileUploadManager();
