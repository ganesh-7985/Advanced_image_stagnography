README.md

Advanced Image Steganography Application

Welcome to the Advanced Image Steganography Application. This project allows users to hide and extract messages within images using least significant bit (LSB) steganography. It supports optional AES encryption, adjustable embedding depth, and provides tools for steganalysis.

Table of Contents

	•	Features
	•	Installation
	•	Usage
	•	User Authentication
	•	Image Upload
	•	Message Hiding
	•	Message Extraction
	•	Image Analysis
	•	Embedding Depth Adjustment
	•	History Log
	•	Dependencies
	•	Project Structure
	•	Contributing
	•	License

Features

	•	User Authentication: Simple login system to personalize user experience.
	•	Message Hiding: Hide messages within images with optional AES encryption.
	•	Message Extraction: Extract hidden messages from images with decryption support.
	•	Adjustable Embedding Depth: Control the number of LSBs used for embedding (1-4 bits).
	•	Image Format Support: Supports PNG, JPEG, and BMP image formats.
	•	Steganalysis Tool: Analyze images to detect potential hidden data.
	•	History Log: Session-based history of hidden and extracted messages.
	•	Responsive UI: User-friendly interface with modern design.

Installation

	1.	Clone the repository:

git clone https://github.com/yourusername/advanced-image-steganography.git


	2.	Navigate to the project directory:

cd advanced-image-steganography


	3.	Open index.html in your web browser:
	•	You can simply double-click the index.html file.
	•	Alternatively, you can serve it using a local web server.
	4.	Ensure internet connectivity:
	•	The application uses the CryptoJS library via CDN for AES encryption.

Usage

User Authentication

	•	Enter your username in the “Enter username” field at the top-right corner.
	•	Click the “Login” button to log in.

Image Upload

	•	Click on the “Click to upload image” area.
	•	Select a PNG, JPEG, or BMP image from your computer.
	•	The image will display in the “Original Image” canvas.
	•	The maximum message size is calculated based on the image and embedding depth.

Message Hiding

	•	Prerequisite: Log in and upload an image.
	•	Enter the message to hide in the “Enter message to hide” textarea.
	•	(Optional) Enter a password to encrypt the message.
	•	Adjust the embedding depth (1-4 bits) as needed.
	•	Ensure the message size does not exceed the displayed maximum capacity.
	•	Click the “Hide Message” button.
	•	The modified image appears in the “Result” canvas.
	•	Download the stego image using the “Download Image” button.

Message Extraction

	•	Prerequisite: Log in and upload the image containing the hidden message.
	•	Enter the password used during hiding (if any).
	•	Set the embedding depth to the same value used during hiding.
	•	Click the “Extract Message” button.
	•	The extracted message appears below.

Image Analysis

	•	Upload an image to the “Original Image” canvas.
	•	Click the “Analyze Image for Hidden Data” button.
	•	An alert indicates if hidden data is likely present.

Embedding Depth Adjustment

	•	Located in the “Embedding Depth (LSBs)” section.
	•	Enter a value between 1 and 4.
	•	Higher values increase capacity but may reduce image quality.
	•	Use the same embedding depth for both hiding and extraction.

History Log

	•	Scroll down to the “History Log” section.
	•	View a list of actions with timestamps.

Dependencies

	•	CryptoJS Library: For AES encryption/decryption.
	•	Included via CDN: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
	•	Modern Web Browser: Supports HTML5 Canvas and JavaScript features.

Project Structure

	•	index.html: Main HTML file containing the application’s structure.
	•	style.css: CSS file for styling the application.
	•	script.js: JavaScript file containing all the functionality.
	•	assets/: (Optional) Directory for images or icons used in the application.

Contributing

Contributions are welcome! Please follow these steps:
	1.	Fork the repository.
	2.	Create your feature branch: git checkout -b feature/YourFeature
	3.	Commit your changes: git commit -m 'Add YourFeature'
	4.	Push to the branch: git push origin feature/YourFeature
	5.	Open a pull request.

