// المتغيرات العامة - الضغط
let selectedFile = null;
let selectedQuality = 'medium';
let downloadUrl = '';

// المتغيرات العامة - الدمج
let mergeFiles = [];
let mergedDownloadUrl = '';

// إعدادات API - عدل هذا الرابط عند النشر
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''  // localhost: استخدم المسار النسبي
    : 'https://ascii-advertising-asian-respected.trycloudflare.com';  // GitHub Pages: استخدم الخادم البعيد (HTTPS)

// عناصر DOM - الضغط
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const compressionOptions = document.getElementById('compressionOptions');
const qualityBtns = document.querySelectorAll('.quality-btn');
const compressBtn = document.getElementById('compressBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const originalSizeEl = document.getElementById('originalSize');
const compressedSizeEl = document.getElementById('compressedSize');
const savedPercentage = document.getElementById('savedPercentage');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// عناصر DOM - الدمج
const mergeUploadArea = document.getElementById('mergeUploadArea');
const mergeFilesInput = document.getElementById('mergeFilesInput');
const selectMergeFilesBtn = document.getElementById('selectMergeFilesBtn');
const mergeFilesList = document.getElementById('mergeFilesList');
const filesCount = document.getElementById('filesCount');
const filesListContainer = document.getElementById('filesListContainer');
const mergeBtn = document.getElementById('mergeBtn');
const clearMergeFilesBtn = document.getElementById('clearMergeFilesBtn');
const mergeProgressSection = document.getElementById('mergeProgressSection');
const mergeProgressFill = document.getElementById('mergeProgressFill');
const mergeProgressText = document.getElementById('mergeProgressText');
const mergeResultSection = document.getElementById('mergeResultSection');
const mergedFilesCount = document.getElementById('mergedFilesCount');
const mergedFileSize = document.getElementById('mergedFileSize');
const downloadMergedBtn = document.getElementById('downloadMergedBtn');
const resetMergeBtn = document.getElementById('resetMergeBtn');

// عناصر DOM - التبويبات
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// دوال مساعدة
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ==================== التبويبات ====================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // إزالة active من جميع الأزرار والمحتويات
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // إضافة active للزر المختار
        btn.classList.add('active');

        // إظهار المحتوى المناسب
        const tabName = btn.dataset.tab;
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

// ==================== وظائف الضغط ====================

// التعامل مع رفع الملفات
selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

function handleFileSelect(file) {
    if (!file) return;

    // التحقق من نوع الملف
    if (file.type !== 'application/pdf') {
        alert('يرجى اختيار ملف PDF فقط');
        return;
    }

    // التحقق من حجم الملف (50 ميجابايت)
    if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز الحد الأقصى المسموح (50 ميجابايت)');
        return;
    }

    selectedFile = file;

    // عرض معلومات الملف
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);

    uploadArea.parentElement.style.display = 'none';
    fileInfo.style.display = 'block';
    compressionOptions.style.display = 'block';
}

removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';

    fileInfo.style.display = 'none';
    compressionOptions.style.display = 'none';
    resultSection.style.display = 'none';
    uploadArea.parentElement.style.display = 'block';
});

// اختيار مستوى الضغط
qualityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        qualityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQuality = btn.dataset.quality;
    });
});

// عملية الضغط
compressBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // إخفاء قسم الخيارات وعرض التقدم
    compressionOptions.style.display = 'none';
    progressSection.style.display = 'block';

    // تعطيل الزر
    compressBtn.disabled = true;

    // إنشاء FormData
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('quality', selectedQuality);

    try {
        // محاكاة التقدم
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
                clearInterval(progressInterval);
                progress = 90;
            }
            updateProgress(progress);
        }, 500);

        // إرسال الطلب للخادم
        const url = `${API_BASE_URL}/api/compress`;
        console.log('Sending request to:', url);
        console.log('API_BASE_URL:', API_BASE_URL);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const result = await response.json();

        // إكمال التقدم
        clearInterval(progressInterval);
        updateProgress(100);

        if (result.success) {
            // عرض النتيجة
            setTimeout(() => {
                progressSection.style.display = 'none';
                displayResult(result);
            }, 500);
        } else {
            throw new Error(result.error || 'فشل في ضغط الملف');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء ضغط الملف: ' + error.message);

        // إعادة العرض
        progressSection.style.display = 'none';
        compressionOptions.style.display = 'block';
        compressBtn.disabled = false;
    }
});

function updateProgress(percent) {
    const roundedPercent = Math.min(100, Math.max(0, Math.round(percent)));
    progressFill.style.width = roundedPercent + '%';
    progressText.textContent = `جاري الضغط... ${roundedPercent}%`;
}

function displayResult(result) {
    originalSizeEl.textContent = formatBytes(result.originalSize);
    compressedSizeEl.textContent = formatBytes(result.compressedSize);
    savedPercentage.textContent = result.compressionRatio + '%';
    downloadUrl = result.downloadUrl;

    resultSection.style.display = 'block';
}

// تحميل الملف المضغوط
downloadBtn.addEventListener('click', () => {
    if (downloadUrl) {
        // إضافة API_BASE_URL للرابط النسبي
        const fullUrl = downloadUrl.startsWith('http')
            ? downloadUrl
            : `${API_BASE_URL}${downloadUrl}`;
        window.location.href = fullUrl;
    }
});

// إعادة التعيين
resetBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    downloadUrl = '';

    resultSection.style.display = 'none';
    uploadArea.parentElement.style.display = 'block';
    compressBtn.disabled = false;

    // إعادة تعيين التقدم
    progressFill.style.width = '0%';
    progressText.textContent = 'جاري الضغط... 0%';
});

// ==================== وظائف الدمج ====================

// اختيار ملفات للدمج
selectMergeFilesBtn.addEventListener('click', () => {
    mergeFilesInput.click();
});

mergeFilesInput.addEventListener('change', (e) => {
    handleMergeFilesSelect(e.target.files);
});

mergeUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mergeUploadArea.classList.add('dragover');
});

mergeUploadArea.addEventListener('dragleave', () => {
    mergeUploadArea.classList.remove('dragover');
});

mergeUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mergeUploadArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
        handleMergeFilesSelect(e.dataTransfer.files);
    }
});

function handleMergeFilesSelect(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        // التحقق من نوع الملف
        if (file.type !== 'application/pdf') {
            alert(`الملف "${file.name}" ليس ملف PDF`);
            return;
        }

        // التحقق من التكرار
        if (mergeFiles.some(f => f.name === file.name && f.size === file.size)) {
            alert(`الملف "${file.name}" مضاف بالفعل`);
            return;
        }

        // إضافة الملف للقائمة
        mergeFiles.push(file);
    });

    updateMergeFilesList();
}

function updateMergeFilesList() {
    if (mergeFiles.length === 0) {
        mergeFilesList.style.display = 'none';
        mergeUploadArea.parentElement.style.display = 'block';
        return;
    }

    mergeUploadArea.parentElement.style.display = 'none';
    mergeFilesList.style.display = 'block';
    filesCount.textContent = mergeFiles.length;

    // عرض الملفات
    filesListContainer.innerHTML = mergeFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-item-number">${index + 1}</div>
            <div class="file-item-info">
                <div class="file-item-name">${file.name}</div>
                <div class="file-item-size">${formatBytes(file.size)}</div>
            </div>
            <button class="file-item-remove" onclick="removeMergeFile(${index})">✕</button>
        </div>
    `).join('');
}

// إزالة ملف من قائمة الدمج
window.removeMergeFile = function(index) {
    mergeFiles.splice(index, 1);
    updateMergeFilesList();
};

// مسح جميع الملفات
clearMergeFilesBtn.addEventListener('click', () => {
    mergeFiles = [];
    mergeFilesInput.value = '';
    updateMergeFilesList();
});

// عملية الدمج
mergeBtn.addEventListener('click', async () => {
    if (mergeFiles.length < 2) {
        alert('يجب اختيار ملفين على الأقل للدمج');
        return;
    }

    // إخفاء قائمة الملفات وعرض التقدم
    mergeFilesList.style.display = 'none';
    mergeProgressSection.style.display = 'block';

    // تعطيل الأزرار
    mergeBtn.disabled = true;
    clearMergeFilesBtn.disabled = true;

    try {
        // إنشاء FormData
        const formData = new FormData();
        mergeFiles.forEach(file => {
            formData.append('pdfs', file);
        });

        // محاكاة التقدم
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) {
                clearInterval(progressInterval);
                progress = 90;
            }
            updateMergeProgress(progress);
        }, 500);

        // إرسال الطلب للخادم
        const url = `${API_BASE_URL}/api/merge`;
        console.log('Sending merge request to:', url);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // إكمال التقدم
        clearInterval(progressInterval);
        updateMergeProgress(100);

        if (result.success) {
            // عرض النتيجة
            setTimeout(() => {
                mergeProgressSection.style.display = 'none';
                displayMergeResult(result);
            }, 500);
        } else {
            throw new Error(result.error || 'فشل في دمج الملفات');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء دمج الملفات: ' + error.message);

        // إعادة العرض
        mergeProgressSection.style.display = 'none';
        mergeFilesList.style.display = 'block';
        mergeBtn.disabled = false;
        clearMergeFilesBtn.disabled = false;
    }
});

function updateMergeProgress(percent) {
    const roundedPercent = Math.min(100, Math.max(0, Math.round(percent)));
    mergeProgressFill.style.width = roundedPercent + '%';
    mergeProgressText.textContent = `جاري الدمج... ${roundedPercent}%`;
}

function displayMergeResult(result) {
    mergedFilesCount.textContent = mergeFiles.length;
    mergedFileSize.textContent = formatBytes(result.mergedSize);
    mergedDownloadUrl = result.downloadUrl;

    mergeResultSection.style.display = 'block';
}

// تحميل الملف المدمج
downloadMergedBtn.addEventListener('click', () => {
    if (mergedDownloadUrl) {
        const fullUrl = mergedDownloadUrl.startsWith('http')
            ? mergedDownloadUrl
            : `${API_BASE_URL}${mergedDownloadUrl}`;
        window.location.href = fullUrl;
    }
});

// إعادة تعيين الدمج
resetMergeBtn.addEventListener('click', () => {
    mergeFiles = [];
    mergeFilesInput.value = '';
    mergedDownloadUrl = '';

    mergeResultSection.style.display = 'none';
    mergeUploadArea.parentElement.style.display = 'block';
    mergeBtn.disabled = false;
    clearMergeFilesBtn.disabled = false;

    // إعادة تعيين التقدم
    mergeProgressFill.style.width = '0%';
    mergeProgressText.textContent = 'جاري الدمج... 0%';
});
