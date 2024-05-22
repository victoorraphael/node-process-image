const express = require('express');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const s3 = new AWS.S3();

const bucketName = process.env.S3_BUCKET;

let memoryCache = {};

// Função para gerar uma chave única para a imagem processada
function generateProcessedKey(filename, params) {
    if (!params || Object.keys(params).length === 0) {
        // Se nenhum parâmetro for passado, retorna o nome do arquivo diretamente na URL
        return filename;
    }

    const { fm, q, w, h, gray } = params;
    const baseName = filename.replace(/\.[^/.]+$/, ""); // remove extensão
    const extension = fm || filename.split('.').pop(); // usa extensão do formato ou original
    return `pictures/${baseName}_${w || 'auto'}x${h || 'auto'}_q${q || 85}_gray${gray || 0}.${extension}`;
}

async function uploadToS3(key, buffer, mimeType) {
    const params = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    };
    try {
        await s3.putObject(params).promise();
        console.log(`Image uploaded successfully to ${key}`);
    } catch (err) {
        console.error('Error uploading image:', err);
    }
}

async function downloadFromS3(key) {
    const s3Params = {
        Bucket: bucketName,
        Key: key
    };
    try {
        const s3Data = await s3.getObject(s3Params).promise();
        return {
            buffer: s3Data.Body,
            mimeType: s3Data.ContentType
        };
    } catch (error) {
        console.error('Error downloading image from S3:', error);
        throw error;
    }
}

app.get('/pictures/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { fm, q, w, h, gray } = req.query;

        const cacheKey = generateProcessedKey(filename, req.query);

        if (memoryCache[cacheKey]) {
            console.log(`Serving from memory cache: ${cacheKey}`);
            res.set('Content-Type', memoryCache[cacheKey].mimeType);
            return res.send(memoryCache[cacheKey].buffer);
        }

        const headParams = {
            Bucket: bucketName,
            Key: cacheKey
        };

        try {
            await s3.headObject(headParams).promise();
            // Se o headObject não lançar erro, a imagem já existe no S3
            console.log(`Serving cached image from S3: ${cacheKey}`);

            const { buffer, mimeType } = await downloadFromS3(cacheKey);

            memoryCache[cacheKey] = {
                buffer,
                mimeType
            };

            res.set('Content-Type', mimeType);
            return res.send(buffer);
        } catch (headErr) {
            if (headErr.code !== 'NotFound') {
                throw headErr;
            }
            console.log(`Image not found in S3, processing new image: ${cacheKey}`);
        }

        const s3Key = `pictures/${filename}`;
        console.log(`Fetching from S3: ${s3Key}`);

        const s3Params = {
            Bucket: bucketName,
            Key: s3Key
        };

        let s3Data;
        try {
            s3Data = await s3.getObject(s3Params).promise();
        } catch (err) {
            if (err.code === 'NoSuchKey') {
                return res.status(404).send('Error: The specified key does not exist.');
            }
            throw err;
        }

        let image = sharp(s3Data.Body);

        const width = w ? parseInt(w) : null;
        const height = h ? parseInt(h) : null;

        if (width || height) {
            image = image.resize(width, height, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            });
        }

        if (gray === '1') {
            image = image.grayscale();
        }

        const quality = q ? parseInt(q) : 85;

        let mimeType = 'image/jpeg';
        switch (fm) {
            case 'png':
                mimeType = 'image/png';
                image = image.png({ quality });
                break;
            case 'webp':
                mimeType = 'image/webp';
                image = image.webp({ quality });
                break;
            default:
                image = image.jpeg({ quality });
        }

        const buffer = await image.toBuffer();

        uploadToS3(cacheKey, buffer, mimeType);

        memoryCache[cacheKey] = {
            buffer,
            mimeType
        };

        res.set('Content-Type', mimeType);
        res.send(buffer);

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image: ' + error.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
