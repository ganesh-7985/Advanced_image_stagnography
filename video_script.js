// Message Size Indicator
let videoCapacity = 0;
function updateMessageSizeIndicator() {
    let indicator = document.getElementById('messageSizeIndicator');
    if (videoCapacity > 0) {
        indicator.innerText = 'Maximum message size: ' + videoCapacity + ' bytes';
    } else {
        indicator.innerText = 'Maximum message size: N/A';
    }
}

// Variables to store media elements
let originalVideo = null;
let resultVideo = null;
let messageBytes = null;
let embeddingDepth = null;

// Handle Video Selection
function handleVideoSelect(event) {
    let file = event.target.files[0];
    if (!file) return;

    let fileType = file.type;
    if (fileType.startsWith('video/')) {
        handleVideoFile(file);
    } else {
        alert('Unsupported media type. Please select a valid video file.');
    }
}

document.getElementById('videoInput').addEventListener('change', handleVideoSelect, false);

// Handle Video File
function handleVideoFile(file) {
    // Verify that 'file' is a File or Blob object
    if (!(file instanceof Blob)) {
        console.error('The uploaded file is not a Blob or File object:', file);
        alert('Invalid file type. Please upload a valid video file.');
        return;
    }

    let videoURL = URL.createObjectURL(file);

    // Display Original Video
    originalVideo = document.getElementById('originalVideo');
    originalVideo.src = videoURL;

    // Prepare Result Video
    resultVideo = document.getElementById('resultVideo');
    resultVideo.src = '';

    // Estimate Video Capacity (simplified estimation)
    originalVideo.onloadedmetadata = function() {
        let width = originalVideo.videoWidth;
        let height = originalVideo.videoHeight;
        // Retrieve frame rate from video settings; default to 25 if unavailable
        let tracks = originalVideo.captureStream().getVideoTracks();
        let frameRate = 25;
        if (tracks.length > 0) {
            let settings = tracks[0].getSettings();
            if (settings.frameRate) {
                frameRate = settings.frameRate;
            }
        }
        embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);
        // Calculate capacity based on first frame
        videoCapacity = Math.floor((width * height * 3 * embeddingDepth) / 8); // 3 color channels (RGB)
        updateMessageSizeIndicator();
    };
}

// Hide Message Function
function hideMessage() {
    if (!originalVideo) {
        alert('Please upload a video first.');
        return;
    }

    let message = document.getElementById('messageInput').value;
    let password = document.getElementById('passwordInput').value;
    embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);

    if (!message) {
        alert('Please enter a message to hide.');
        return;
    }

    if (password) {
        message = CryptoJS.AES.encrypt(message, password).toString();
    }

    messageBytes = new TextEncoder().encode(message + '\0'); // Add null terminator

    // Check if message fits
    if (messageBytes.length > videoCapacity) {
        alert('Message is too long to hide in this video with current embedding depth.');
        return;
    }

    // Start processing the video
    processVideo();
}

// Process Video Function
function processVideo() {
    let video = originalVideo;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Prepare MediaRecorder to record the processed video
    let stream = canvas.captureStream(25); // Set frame rate to 25 FPS
    let mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
    let chunks = [];

    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function() {
        let blob = new Blob(chunks, { type: 'video/webm' });
        let videoURL = URL.createObjectURL(blob);
        resultVideo.src = videoURL;
        alert('Message hidden successfully.');
    };

    mediaRecorder.start();

    video.pause();
    video.currentTime = 0;

    video.onseeked = function() {
        // Draw the first frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Embed message into the first frame
        frameData = embedMessageInData(frameData, messageBytes, embeddingDepth);

        ctx.putImageData(frameData, 0, 0);

        // Record the first frame
        mediaRecorder.requestData();

        // Continue recording the rest of the video without modifications
        recordRemainingVideo(video, canvas, ctx, mediaRecorder);
    };

    video.play();
}

// Record Remaining Video Function
function recordRemainingVideo(video, canvas, ctx, mediaRecorder) {
    function processFrame() {
        if (video.ended) {
            mediaRecorder.stop();
            return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        mediaRecorder.requestData();

        requestAnimationFrame(processFrame);
    }

    video.addEventListener('play', function() {
        processFrame();
    }, { once: true });
}

// Embed Message in ImageData Function
function embedMessageInData(imageData, messageBytes, embeddingDepth) {
    let imgData = imageData.data;
    let msgLen = messageBytes.length;
    let msgIndex = 0;

    let dataIndex = 0;
    while (msgIndex < msgLen && dataIndex < imgData.length) {
        let byte = messageBytes[msgIndex];

        for (let bit = 0; bit < 8; bit += embeddingDepth) {
            if (dataIndex >= imgData.length) {
                break;
            }
            let bitsToEmbed = (byte >> (8 - embeddingDepth - bit)) & ((1 << embeddingDepth) - 1);
            imgData[dataIndex] = (imgData[dataIndex] & ~((1 << embeddingDepth) - 1)) | bitsToEmbed;
            dataIndex++;
        }
        msgIndex++;
    }

    return imageData;
}

// Extract Message Function
function extractMessage() {
    let stegoVideo = document.getElementById('originalVideo'); // User needs to upload the stego video here
    if (!stegoVideo.src) {
        alert('Please upload a stego video first.');
        return;
    }

    let password = document.getElementById('passwordInputExtract').value;
    embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);

    extractMessageFromVideo(stegoVideo).then((extractedMessage) => {
        if (password) {
            try {
                let decrypted = CryptoJS.AES.decrypt(extractedMessage, password);
                extractedMessage = decrypted.toString(CryptoJS.enc.Utf8);

                if (!extractedMessage) {
                    extractedMessage = 'Error decrypting message with provided password.';
                }
            } catch (e) {
                extractedMessage = 'Error decrypting message with provided password.';
            }
        }

        document.getElementById('extractedMessage').innerText = 'Extracted Message: ' + extractedMessage;
    });
}

// Extract Message from Video Function
function extractMessageFromVideo(videoElement) {
    return new Promise((resolve) => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        videoElement.onloadedmetadata = function() {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            videoElement.currentTime = 0;

            videoElement.onseeked = function() {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let extractedMessage = extractMessageFromData(imageData, embeddingDepth);
                resolve(extractedMessage);
            };

            videoElement.currentTime = 0;
        };
    });
}

// Extract Message from ImageData Function
function extractMessageFromData(imageData, embeddingDepth) {
    let imgData = imageData.data;
    let extractedBytes = [];
    let byte = 0;

    let dataIndex = 0;
    while (dataIndex < imgData.length) {
        byte = 0;
        for (let bit = 0; bit < 8; bit += embeddingDepth) {
            if (dataIndex >= imgData.length) {
                break;
            }
            let bitsExtracted = imgData[dataIndex] & ((1 << embeddingDepth) - 1);
            byte = (byte << embeddingDepth) | bitsExtracted;
            dataIndex++;
        }

        if (byte === 0) { // Null terminator
            break;
        }

        extractedBytes.push(byte);
    }

    let extractedMessage = new TextDecoder().decode(new Uint8Array(extractedBytes));

    return extractedMessage;
}

// Download Video Function
function downloadVideo() {
    if (!resultVideo || !resultVideo.src) {
        alert('No video to download.');
        return;
    }

    let videoURL = resultVideo.src;
    let link = document.createElement('a');
    link.download = 'stego_video.webm';
    link.href = videoURL;
    link.click();
}

// Analyze Video Function
function analyzeVideo() {
    let stegoVideo = document.getElementById('originalVideo'); // Assuming the user re-uploads the stego video to originalVideo
    if (!stegoVideo.src) {
        alert('Please upload a video first.');
        return;
    }

    let video = stegoVideo;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    video.onseeked = function() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let result = detectHiddenData(imageData);

        if (result) {
            alert('This video may contain hidden data.');
        } else {
            alert('No significant hidden data detected.');
        }
    };

    video.currentTime = 0;
}

// Detect Hidden Data Function
function detectHiddenData(imageData) {
    let imgData = imageData.data;
    let changes = 0;

    for (let i = 0; i < imgData.length - 1; i++) {
        if ((imgData[i] & 0x01) !== (imgData[i + 1] & 0x01)) {
            changes++;
        }
    }

    let changeRate = changes / imgData.length;
    return changeRate > 0.4;
}

// Initialize embeddingDepth
document.addEventListener('DOMContentLoaded', () => {
    embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);
});

// Update capacity when embedding depth changes
document.getElementById('embeddingDepth').addEventListener('input', () => {
    embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);
    if (originalVideo && originalVideo.readyState >= 1) {
        handleVideoFile(originalVideo);
    }
});