document.addEventListener("DOMContentLoaded", () => {
    const fileInputs = [
      document.getElementById("fileInput1"),
      document.getElementById("fileInput2"),
      document.getElementById("fileInput3"),
    ];
    const cleanupButton = document.getElementById("cleanupButton");
    const cleanupStatus = document.getElementById("cleanupStatus");
    const excludeButton = document.getElementById("excludeButton");
    const fileStatus = document.getElementById("fileStatus");
    const generateEssayButton = document.getElementById("generateEssayButton");
    const questionTextarea = document.querySelector("textarea");
    const responseDiv = document.getElementById("response");
    const saveButton = document.getElementById("saveButton");
    const submitButton = document.getElementById("submitButton");
    const uploadButton = document.getElementById("uploadButton");
    const modal = document.getElementById("essayModal");
    const closeButton = document.querySelector(".close-button");

    // Enable buttons when appropriate
    function toggleFormButtons(enable) {
      submitButton.disabled = !enable;
      // Only enable save/exclude buttons after a response is received
      if (responseDiv.textContent.trim()) {
          saveButton.disabled = !enable;
          excludeButton.disabled = !enable;
      }
      // Only enable generate essay button if there are saved chats
      const savedChatsDiv = document.getElementById('savedChats');
      generateEssayButton.disabled = !(enable && savedChatsDiv.children.length > 0);
    }

    // Add this to handle response updates
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target === responseDiv && responseDiv.textContent.trim()) {
                saveButton.disabled = false;
                excludeButton.disabled = false;
            }
        });
    });

    observer.observe(responseDiv, { 
        childList: true,
        characterData: true,
        subtree: true 
    });

    // File upload logic
    uploadButton.addEventListener("click", async () => {
      const files = fileInputs.map(input => input.files[0]).filter(Boolean);

      // Reset status
      fileStatus.textContent = "";
      toggleFormButtons(false);

      if (files.length === 0) {
        fileStatus.textContent = "Please upload at least one file.";
        return;
      }

      if (files.some(file => file.type !== "application/pdf")) {
        fileStatus.textContent = "Invalid file type. Only PDF files are allowed.";
        return;
      }

      fileStatus.textContent = "Uploading files...";

      const formData = new FormData();
      files.forEach((file, index) => formData.append(`file${index + 1}`, file));

      try {
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          fileStatus.textContent = "Files uploaded successfully.";
          uploadButton.disabled = true; // Disable upload button
          toggleFormButtons(true);
          cleanupButton.disabled = false; // Enable cleanup button
        } else {
          fileStatus.textContent = result.error || "Failed to upload the files.";
        }
      } catch (error) {
        fileStatus.textContent = "An error occurred during upload.";
        console.error("Upload error:", error);
      }
    });

    // Show progress for question submission
    document.getElementById("questionForm").addEventListener("submit", () => {
      responseDiv.textContent = "Processing your question...";
    });

    // Cleanup logic
    cleanupButton.addEventListener("click", async () => {
      cleanupStatus.textContent = "Cleaning up...";

      try {
        const response = await fetch("/cleanup", {
          method: "POST",
        });

        const result = await response.json();

        if (response.ok) {
          cleanupStatus.textContent = result.message || "Cleanup successful.";

          // Reset to initial state
          fileInputs.forEach(input => (input.value = ""));
          fileStatus.textContent = "";
          cleanupStatus.textContent = "";
          responseDiv.textContent = "";
          uploadButton.disabled = false;
          toggleFormButtons(false);
          cleanupButton.disabled = true;

          // Reset the question form
          questionTextarea.value = "";
          questionTextarea.placeholder = "What would you like to know about these documents?";

          // Clear saved responses
          const savedChatsDiv = document.getElementById('savedChats');
          savedChatsDiv.innerHTML = '';
          generateEssayButton.disabled = true;

        } else {
          cleanupStatus.textContent = result.error || "Failed to cleanup files.";
        }
      } catch (error) {
        cleanupStatus.textContent = "An error occurred during cleanup.";
        console.error("Cleanup error:", error);
      }
    });

    // Save the current response
    saveButton.addEventListener("click", () => {
        if (!responseDiv.textContent.trim()) return;
        
        const currentResponse = responseDiv.innerHTML;
        const currentQuestion = questionTextarea.value;
        const timestamp = new Date().toLocaleString();
        
        const savedChat = document.createElement('div');
        savedChat.className = 'saved-chat';
        savedChat.innerHTML = `
            <div class="saved-timestamp">${timestamp}</div>
            <div class="saved-question"><strong>Q:</strong> ${currentQuestion}</div>
            <div class="saved-answer"><strong>A:</strong> ${currentResponse}</div>
        `;
        
        const savedChatsDiv = document.getElementById('savedChats');
        savedChatsDiv.insertBefore(savedChat, savedChatsDiv.firstChild);
        
        // Enable generate essay button when there are saved chats
        generateEssayButton.disabled = false;
        
        fetch('/saveChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                question: currentQuestion,
                answer: currentResponse,
                timestamp: timestamp
            })
        })
        .then(response => response.text())
        .then(result => console.log('Save result:', result))
        .catch(error => console.error('Error saving chat:', error));
    });

    // Exclude the current response
    excludeButton.addEventListener("click", () => {
      const currentResponse = responseDiv.textContent;
      fetch('/excludeChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat: currentResponse })
      })
      .then(response => response.text())
      .then(result => console.log('Exclude result:', result))
      .catch(error => console.error('Error excluding chat:', error));
    });

    // Close modal when clicking the close button
    closeButton.onclick = () => {
        modal.style.display = "none";
    };

    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Update the essay generation button handler
    generateEssayButton.addEventListener("click", () => {
        // Disable button and change text
        generateEssayButton.disabled = true;
        generateEssayButton.innerHTML = '&#x23F3; Generating Essay...';

        fetch('/generateEssay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                // Reset button on error
                generateEssayButton.disabled = false;
                generateEssayButton.innerHTML = 'Generate Essay';
                return;
            }
            
            // Display essay in modal
            document.getElementById('essayContent').innerHTML = `
                <div id="printableEssay">
                    <h1>Generated Essay</h1>
                    <div class="essay-content">${data.essay}</div>
                    <p class="essay-footer">Based on ${data.sourcesCount} saved conversations</p>
                </div>
            `;
            modal.style.display = "block";
            
            // Reset button after successful generation
            generateEssayButton.disabled = false;
            generateEssayButton.innerHTML = 'Generate Essay';
            
            // Setup PDF download button
            const downloadButton = document.getElementById('downloadPdfButton');
            downloadButton.onclick = () => {
                const printContent = document.getElementById('printableEssay').innerHTML;
                const printWindow = window.open('', '_blank');
                
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Generated Essay</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                margin: 40px;
                            }
                            h1 {
                                text-align: center;
                                color: #333;
                            }
                            .essay-content {
                                margin: 20px 0;
                                text-align: justify;
                            }
                            .essay-footer {
                                text-align: right;
                                font-size: 0.9em;
                                color: #666;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                printWindow.focus();
                
                // Wait for content to load
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            };
        })
        .catch(error => {
            console.error('Error generating essay:', error);
            alert('Failed to generate essay. Please try again.');
            // Reset button on error
            generateEssayButton.disabled = false;
            generateEssayButton.innerHTML = 'Generate Essay';
        });
    });
  });