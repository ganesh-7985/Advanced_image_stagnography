// User Authentication
let currentUser = null;
function login() {
    let username = document.getElementById('username').value.trim();
    if (username) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        alert('Logged in as ' + username);
    } else {
        alert('Please enter a username.');
    }
}

// Message Size Indicator
let imageCapacity = 0;
function updateMessageSizeIndicator() {
    let indicator = document.getElementById('messageSizeIndicator');
    if (imageCapacity > 0) {
        indicator.innerText = 'Maximum message size: ' + imageCapacity + ' bytes';
    } else {
        indicator.innerText = 'Maximum message size: N/A';
    }
}

// Handle File Selection
function handleFileSelect(event) {
    let file = event.target.files[0];
    let reader = new FileReader();

    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.getElementById('myCanvas');
            let ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            let canvas1 = document.getElementById('myCanvas1');
            let ctx1 = canvas1.getContext('2d');
            canvas1.width = img.width;
            canvas1.height = img.height;
            ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
            ctx1.drawImage(img, 0, 0);

            // Calculate Image Capacity
            calculateImageCapacity();
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

document.getElementById('imageInput').addEventListener('change', handleFileSelect, false);

// Calculate Image Capacity
function calculateImageCapacity() {
    let embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imageCapacity = Math.floor((imgData.data.length * embeddingDepth) / 8);
    updateMessageSizeIndicator();
}

// Update capacity when embedding depth changes
document.getElementById('embeddingDepth').addEventListener('input', calculateImageCapacity);

// Hide Message Function
function hideMessage() {
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }

    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    let canvas1 = document.getElementById('myCanvas1');
    let ctx1 = canvas1.getContext('2d');

    let message = document.getElementById('messageInput').value;
    let password = document.getElementById('passwordInput').value;
    let embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);

    if (!message) {
        alert('Please enter a message to hide.');
        return;
    }

    if (password) {
        message = CryptoJS.AES.encrypt(message, password).toString();
    }

    let messageBytes = new TextEncoder().encode(message + '\0'); // Add null terminator

    // Check if message fits in the image
    let totalAvailableBytes = Math.floor((canvas.width * canvas.height * 4 * embeddingDepth) / 8);
    if (messageBytes.length > totalAvailableBytes) {
        alert('Message is too long to hide in this image with current embedding depth.');
        return;
    }

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    imageData = hideMessageInImage(imageData, messageBytes, embeddingDepth);

    ctx1.putImageData(imageData, 0, 0);

    document.getElementById('myCanvas1').style.display = 'block';

    // Save to history
    addToHistory('Message hidden successfully.');

    alert('Message hidden successfully.');
}

// Hide Message in Image Function
function hideMessageInImage(imageData, messageBytes, embeddingDepth) {
    let imgData = imageData.data;
    let msgLen = messageBytes.length;
    let msgIndex = 0;

    let totalBits = imgData.length * embeddingDepth;
    let requiredBits = msgLen * 8;
    if (requiredBits > totalBits) {
        alert('Message is too long to hide in this image.');
        return imageData;
    }

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
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }

    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    let embeddingDepth = parseInt(document.getElementById('embeddingDepth').value);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let extractedMessage = extractMessageFromImage(imageData, embeddingDepth);

    let password = document.getElementById('passwordInputExtract').value;

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

    // Save to history
    addToHistory('Message extracted: ' + extractedMessage);
}

// Extract Message from Image Function
function extractMessageFromImage(imageData, embeddingDepth) {
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

        if (byte === 0) {
            break;
        }

        extractedBytes.push(byte);
    }

    let extractedMessage = new TextDecoder().decode(new Uint8Array(extractedBytes));

    return extractedMessage;
}

// Download Image Function
function downloadImage() {
    let canvas = document.getElementById('myCanvas1');
    let imageType = 'image/png';
    let image = canvas.toDataURL(imageType).replace(imageType, 'image/octet-stream');
    let link = document.createElement('a');
    link.download = 'stego_image.png';
    link.href = image;
    link.click();
}

// Analyze Image Function
function analyzeImage() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let result = detectHiddenData(imageData);

    if (result) {
        alert('This image may contain hidden data.');
    } else {
        alert('No significant hidden data detected.');
    }
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

// History Log Functions
function addToHistory(action) {
    let historyList = document.getElementById('historyList');
    let listItem = document.createElement('li');
    listItem.innerText = new Date().toLocaleString() + ' - ' + action;
    historyList.appendChild(listItem);
}

function loadHistory() {
    let historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
}

// On Page Load
window.onload = function() {
    currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        document.getElementById('username').value = currentUser;
    }
    loadHistory();
    updateMessageSizeIndicator();
};