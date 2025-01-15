document.addEventListener("DOMContentLoaded", () => {
    const fileInputs = [
      document.getElementById("fileInput1"),
      document.getElementById("fileInput2"),
      document.getElementById("fileInput3"),
    ];
    const cleanupButton = document.getElementById("cleanupButton");
    const cleanupStatus = document.getElementById("cleanupStatus");
    const endSessionButton = document.getElementById("endSessionButton");
    const excludeButton = document.getElementById("excludeButton");
    const fileStatus = document.getElementById("fileStatus");
    const questionTextarea = document.querySelector("textarea");
    const responseDiv = document.getElementById("response");
    const saveButton = document.getElementById("saveButton");
    const submitButton = document.getElementById("submitButton");
    const uploadButton = document.getElementById("uploadButton");

    // Enable buttons when appropriate
    function toggleFormButtons(enable) {
      submitButton.disabled = !enable;
      endSessionButton.disabled = !enable;
      saveButton.disabled = !enable;
      excludeButton.disabled = !enable;
    }

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
      const currentResponse = responseDiv.textContent;
      fetch('/saveChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat: currentResponse })
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

    // End session and generate essay
    endSessionButton.addEventListener("click", () => {
      fetch('/generateEssay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        responseDiv.innerHTML = `<h2>Generated Essay</h2><p>${data.essay}</p>`;
        console.log('Essay generated:', data.essay);
      })
      .catch(error => console.error('Error generating essay:', error));
    });
  });