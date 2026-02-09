const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 8080;

// CORS Configuration - Allow requests from GitHub Pages and everywhere
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Add CORS headers manually as backup
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static('public'));

// إنشاء المجلدات المطلوبة
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// إعدادات Multer لرفع الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('فقط ملفات PDF مسموح بها'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // حد أقصى 50 ميجابايت
    }
});

// دالة ضغط PDF باستخدام Ghostscript
async function compressPDF(inputPath, outputPath, quality) {
    // إعدادات جودة Ghostscript للضغط
    // /screen: 72 dpi - جودة منخفضة جداً (أصغر حجم)
    // /ebook: 150 dpi - جودة منخفضة (حجم صغير)
    // /printer: 300 dpi - جودة متوسطة (حجم متوسط)
    // /prepress: 300 dpi + الحفاظ على اللون - جودة عالية (حجم أكبر)
    // /default: جودة جيدة مع ضغط معقول

    const qualitySettings = {
        low: '/screen',      // 72 dpi - أصغر حجم
        medium: '/ebook',    // 150 dpi - توازن جيد
        high: '/printer'     // 300 dpi - جودة عالية
    };

    const setting = qualitySettings[quality] || qualitySettings.medium;

    // أمر Ghostscript للضغط
    const command = `gs -sDEVICE=pdfwrite \
        -dCompatibilityLevel=1.4 \
        -dPDFSETTINGS=${setting} \
        -dNOPAUSE -dQUIET -dBATCH \
        -dDownsampleColorImages=true \
        -dDownsampleGrayImages=true \
        -dDownsampleMonoImages=true \
        -dColorImageResolution=${quality === 'low' ? '72' : quality === 'medium' ? '150' : '300'} \
        -dGrayImageResolution=${quality === 'low' ? '72' : quality === 'medium' ? '150' : '300'} \
        -dMonoImageResolution=${quality === 'low' ? '72' : quality === 'medium' ? '150' : '300'} \
        -sOutputFile="${outputPath}" \
        "${inputPath}"`;

    try {
        await execAsync(command);
    } catch (error) {
        console.error('Ghostscript error:', error);
        throw new Error('فشل في ضغط الملف');
    }

    // إرجاع معلومات عن الملفات
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    return {
        originalSize,
        compressedSize,
        compressionRatio
    };
}

// API Endpoint لضغط PDF
app.post('/api/compress', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم رفع ملف' });
        }

        const quality = req.body.quality || 'medium';
        const inputPath = req.file.path;
        const outputFilename = `compressed_${uuidv4()}.pdf`;
        const outputPath = path.join(downloadsDir, outputFilename);

        // ضغط الملف
        const result = await compressPDF(inputPath, outputPath, quality);

        // حذف الملف الأصلي بعد المعالجة
        fs.unlinkSync(inputPath);

        res.json({
            success: true,
            downloadUrl: `/api/download/${outputFilename}`,
            ...result
        });

    } catch (error) {
        console.error('خطأ في الضغط:', error);
        res.status(500).json({ error: 'فشل في ضغط الملف' });
    }
});

// API Endpoint لتحميل الملف المضغوط
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(downloadsDir, filename);

    // Add CORS headers for download endpoint
    res.header('Access-Control-Allow-Origin', '*');

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'الملف غير موجود' });
    }
});

// Endpoint لحذف الملفات القديمة (يمكن استدعاؤه بشكل دوري)
app.delete('/api/cleanup', (req, res) => {
    try {
        const files = fs.readdirSync(downloadsDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة

        files.forEach(file => {
            const filePath = path.join(downloadsDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
            }
        });

        res.json({ success: true, message: 'تم تنظيف الملفات القديمة' });
    } catch (error) {
        res.status(500).json({ error: 'فشل في التنظيف' });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على http://localhost:${PORT}`);
    console.log(`CORS مفعّل - يقبل الطلبات من جميع المصادر`);
});
