// المتغيرات العامة
let selectedFile = null;
let selectedQuality = 'medium';
let downloadUrl = '';

// إعدادات API - عدل هذا الرابط عند النشر
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''  // localhost: استخدم المسار النسبي
    : 'http://82.25.116.131:8080';  // GitHub Pages: استخدم الخادم البعيد

// عناصر DOM
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

// دوال مساعدة
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

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

    uploadArea.style.display = 'none';
    fileInfo.style.display = 'block';
    compressionOptions.style.display = 'block';
}

removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';

    fileInfo.style.display = 'none';
    compressionOptions.style.display = 'none';
    resultSection.style.display = 'none';
    uploadArea.style.display = 'block';
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
        const response = await fetch(`${API_BASE_URL}/api/compress`, {
            method: 'POST',
            body: formData
        });

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
    uploadArea.style.display = 'block';
    compressBtn.disabled = false;

    // إعادة تعيين التقدم
    progressFill.style.width = '0%';
    progressText.textContent = 'جاري الضغط... 0%';
});
