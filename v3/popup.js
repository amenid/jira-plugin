document.addEventListener('DOMContentLoaded', function () {
    // Éviter la duplication de l'événement DOMContentLoaded
    // Au chargement du popup, envoyer automatiquement le message pour afficher la bulle
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            // Envoyer le message pour afficher la bulle automatiquement
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleChatBubble" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Erreur lors de l'envoi du message:", chrome.runtime.lastError);
                    
                    // Tentative d'injecter et d'exécuter la fonction directement si le message échoue
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: function() {
                            // Vérifier si la bulle existe déjà
                            if (document.getElementById("chatBubble")) {
                                document.getElementById("chatBubble").style.display = "flex";
                                document.getElementById("chatBubble").style.visibility = "visible";
                            } else if (window.createBubbleChat) {
                                // Si la fonction existe, l'appeler
                                window.createBubbleChat();
                            } else {
                                console.error("Impossible d'afficher la bulle de chat");
                            }
                        }
                    });
                } else if (response && response.success) {
                    console.log("Bulle de chat affichée avec succès");
                }
            });
        }
    });
    

    }
)
// Function to toggle elements based on checkbox state
function toggleElements() {
    var checkbox = document.getElementById('enable-notifications');
    var tokenInput = document.getElementById('token-input');
    var tokenBtn = document.getElementById('token-btn');
    var saveBtn = document.getElementById('save-btn');
    var testBtn = document.getElementById('test-btn');
    var debugBtn = document.getElementById('debug-btn');
    
    // Toggle disabled state - this makes the elements non-interactive
    tokenInput.disabled = !checkbox.checked;
    tokenBtn.disabled = !checkbox.checked;
    saveBtn.disabled = !checkbox.checked;
    testBtn.disabled = !checkbox.checked;
    debugBtn.disabled = !checkbox.checked;
    
    // Toggle visual styles - this changes how they look
    if (!checkbox.checked) {
      // Apply 'disabled' class for visual feedback
      tokenInput.classList.add('disabled');
      tokenBtn.classList.add('disabled');
      saveBtn.classList.add('disabled');
      testBtn.classList.add('disabled');
      debugBtn.classList.add('disabled');
      
      // Additional visual cues for buttons
      tokenBtn.style.opacity = '0.5';
      tokenBtn.style.cursor = 'not-allowed';
      saveBtn.style.opacity = '0.5';
      saveBtn.style.cursor = 'not-allowed';
      testBtn.style.opacity = '0.5';
      testBtn.style.cursor = 'not-allowed';
      debugBtn.style.opacity = '0.5';
      debugBtn.style.cursor = 'not-allowed';
    } else {
      // Remove 'disabled' class
      tokenInput.classList.remove('disabled');
      tokenBtn.classList.remove('disabled');
      saveBtn.classList.remove('disabled');
      testBtn.classList.remove('disabled');
      debugBtn.classList.remove('disabled');
      
      // Restore normal button appearance
      tokenBtn.style.opacity = '1';
      tokenBtn.style.cursor = 'pointer';
      saveBtn.style.opacity = '1';
      saveBtn.style.cursor = 'pointer';
      testBtn.style.opacity = '1';
      testBtn.style.cursor = 'pointer';
      debugBtn.style.opacity = '1';
      debugBtn.style.cursor = 'pointer';
    }
  }
  
  // Show token instructions modal
  function showTokenModal() {
    var checkbox = document.getElementById('enable-notifications');
    if (checkbox.checked) {
      document.getElementById('token-modal').style.display = 'block';
    }
  }
  
  // Close token instructions modal
  function closeTokenModal() {
    document.getElementById('token-modal').style.display = 'none';
  }
  
  // Show status message
  function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = ''; // Clear existing classes
    statusElement.classList.add('status-' + type);
    statusElement.style.display = 'block';
    
    // Hide the message after 5 seconds
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
  
  // Custom alert function (replacement for SweetAlert)
  function showCustomAlert(title, message, type, closePopup = false) {
    // Create alert element
    const alertOverlay = document.createElement('div');
    alertOverlay.style.position = 'fixed';
    alertOverlay.style.top = '0';
    alertOverlay.style.left = '0';
    alertOverlay.style.width = '100%';
    alertOverlay.style.height = '100%';
    alertOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    alertOverlay.style.display = 'flex';
    alertOverlay.style.justifyContent = 'center';
    alertOverlay.style.alignItems = 'center';
    alertOverlay.style.zIndex = '9999';
  
    // Colors based on type
    const colors = {
      success: '#36B37E',
      error: '#FF5630',
      warning: '#FFAB00',
      info: '#0065FF'
    };
  
    // Icons (simple unicode symbols)
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
  
    // Alert content
    const alertBox = document.createElement('div');
    alertBox.style.backgroundColor = 'white';
    alertBox.style.borderRadius = '8px';
    alertBox.style.padding = '20px';
    alertBox.style.width = '300px';
    alertBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    alertBox.style.textAlign = 'center';
  
    // Icon
    const iconSpan = document.createElement('div');
    iconSpan.textContent = icons[type] || icons.info;
    iconSpan.style.fontSize = '32px';
    iconSpan.style.color = colors[type] || colors.info;
    iconSpan.style.marginBottom = '10px';
  
    // Title
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '10px 0';
    titleElement.style.color = '#172B4D';
  
    // Message
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.margin = '10px 0 20px 0';
    messageElement.style.color = '#505F79';
  
    // Button
    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.backgroundColor = colors[type] || colors.info;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.padding = '8px 16px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
  
    // Assemble elements
    alertBox.appendChild(iconSpan);
    alertBox.appendChild(titleElement);
    alertBox.appendChild(messageElement);
    alertBox.appendChild(button);
    alertOverlay.appendChild(alertBox);
  
    // Add to page
    document.body.appendChild(alertOverlay);
  
    // Function to close alert
    const closeAlert = () => {
      document.body.removeChild(alertOverlay);
      if (closePopup) {
        window.close();
      }
    };
  
    // Button click event
    button.addEventListener('click', closeAlert);
  
    // Auto-close for success
    if (type === 'success') {
      setTimeout(closeAlert, 2000);
    }
  
    // Allow closing by clicking outside
    alertOverlay.addEventListener('click', (e) => {
      if (e.target === alertOverlay) {
        closeAlert();
      }
    });
  
    return true;
  }
  
  // Validate token format
  function validateToken(token) {
    // Email:token format
    if (token.includes(':')) {
      const parts = token.split(':');
      if (parts.length !== 2) return false;
      
      const email = parts[0];
      const apiToken = parts[1];
      
      // Basic email validation
      if (!email.includes('@') || !email.includes('.')) return false;
      
      // Basic API token validation (at least 5 characters)
      if (apiToken.length < 5) return false;
      
      return true;
    }
    
    // Just an API token (should be at least 5 characters)
    return token.length >= 5;
  }
  
  // Test notifications manually
  function testNotifications() {
    chrome.storage.local.get(['notifications_enabled', 'atlassian_token'], function(result) {
      if (result.notifications_enabled !== 'true' || !result.atlassian_token) {
        showCustomAlert('Warning', 'Please save your settings before testing notifications.', 'warning');
        return;
      }
      
      showStatus('Testing notifications...', 'success');
      
      chrome.runtime.sendMessage({action: "testNotifications"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending test message:', chrome.runtime.lastError);
          showCustomAlert('Error', 'Error testing notifications. Check console for details.', 'error');
        } else {
          console.log('Test response:', response);
          showCustomAlert('Testing', 'Testing notifications. Check for notifications!', 'info');
        }
      });
    });
  }
  
  // Test email sending
  function testEmailSending() {
    chrome.storage.local.get(['notifications_enabled', 'atlassian_token'], function(result) {
      if (result.notifications_enabled !== 'true' || !result.atlassian_token) {
        showCustomAlert('Warning', 'Please save your settings before testing email.', 'warning');
        return;
      }
      
      showStatus('Testing email sending...', 'success');
      
      chrome.runtime.sendMessage({action: "testEmailSending"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending test email message:', chrome.runtime.lastError);
          showCustomAlert('Error', 'Error testing email. Check console for details.', 'error');
        } else {
          console.log('Email test response:', response);
          if (response.success) {
            showCustomAlert('Success', 'Test email sent successfully. Please check your inbox.', 'success');
          } else {
            showCustomAlert('Error', 'Failed to send test email: ' + (response.message || 'Unknown error'), 'error');
          }
        }
      });
    });
  }
  
  // Debug connection
  function debugConnection() {
    chrome.storage.local.get(['notifications_enabled', 'atlassian_token', 'jira_domains'], function(result) {
      console.log('Stored settings:', {
        enabled: result.notifications_enabled,
        token: result.atlassian_token ? '(Token exists)' : '(No token)',
        domains: result.jira_domains || []
      });
      
      if (result.notifications_enabled !== 'true' || !result.atlassian_token) {
        showCustomAlert('Warning', 'Please save your settings before debugging.', 'warning');
        return;
      }
      
      showStatus('Testing Jira connection...', 'success');
      
      chrome.runtime.sendMessage({action: "testJiraConnection"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending debug message:', chrome.runtime.lastError);
          showCustomAlert('Error', 'Error testing connection. Check console for details.', 'error');
        } else {
          console.log('Debug response:', response);
          
          // Format results for display
          let resultText = '';
          if (response.results && response.results.length > 0) {
            response.results.forEach(result => {
              resultText += `Domain: ${result.domain}\n`;
              resultText += `Accessible: ${result.accessible ? 'Yes' : 'No'}\n`;
              if (result.authenticated) {
                resultText += `Authenticated as: ${result.user}\n`;
              } else {
                resultText += `Authentication: Failed\n`;
              }
              resultText += '-------------------\n';
            });
          } else {
            resultText = 'No detailed results available.';
          }
          
          showCustomAlert('Connection Test Results', resultText, 'info');
        }
      });
    });
  }
  
  // Save settings
  function saveSettings() {
    var checkbox = document.getElementById('enable-notifications');
    
    if (!checkbox.checked) {
      // If notifications are disabled, clear settings
      chrome.storage.local.remove(['atlassian_token', 'notifications_enabled'], function() {
        showCustomAlert('Disabled', 'Notifications have been disabled.', 'info', true);
      });
      return;
    }
    
    // Get token value from form
    var token = document.getElementById('token-input').value.trim();
    
    // Validate input
    if (!token) {
      showCustomAlert('Error', 'Please enter your Atlassian token.', 'error');
      return;
    }
    
    // Validate token format
    if (!validateToken(token)) {
      if (confirm('The token format may be incorrect. For best results, use the format "email@example.com:api-token". Continue anyway?')) {
        saveTokenToStorage(token);
      }
    } else {
      saveTokenToStorage(token);
    }
  }
  
  // Helper function to save token to storage and show success message
  function saveTokenToStorage(token) {
    // Extract email from token if in email:token format
    let email = '';
    if (token.includes(':')) {
      email = token.split(':')[0];
    }
    
    // Save settings to chrome.storage
    chrome.storage.local.set({
      'atlassian_token': token,
      'notifications_enabled': 'true',
      'user_email': email
    }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        showCustomAlert('Error', 'Error saving settings. Please try again.', 'error');
      } else {
        // Show success message and close popup
        showCustomAlert(
          'Success!', 
          'Your notification settings have been saved. You will receive alerts for comments, labels, due dates, and sprints.', 
          'success', 
          true
        );
      }
    });
  }
  // Add debug button to HTML
function addDebugButtonToSettings() {
    const settingsSection = document.querySelector('.settings-section');
    if (!settingsSection) return;
    
    const debugDiv = document.createElement('div');
    debugDiv.className = 'setting-item';
    debugDiv.innerHTML = `
      <h3>Debug Tools</h3>
      <button id="debug-email-btn" class="btn">Debug Email Sending</button>
      <div id="debug-results" class="debug-output" style="margin-top: 10px; font-size: 12px; white-space: pre-wrap;"></div>
    `;
    
    settingsSection.appendChild(debugDiv);
    
    // Add event listener
    document.getElementById('debug-email-btn').addEventListener('click', async function() {
      const resultsDiv = document.getElementById('debug-results');
      resultsDiv.textContent = 'Running email diagnostics...';
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: "debugEmailSending"
        });
        
        resultsDiv.textContent = JSON.stringify(response, null, 2);
      } catch (error) {
        resultsDiv.textContent = `Error: ${error.message}`;
      }
    });
  }
  
  // Call this function when initializing your popup
  document.addEventListener('DOMContentLoaded', function() {
    // Your existing code...
    
    // Add debug tools
    addDebugButtonToSettings();
  });
  
  // Initialize on page load - this ensures elements start in the correct state
  document.addEventListener('DOMContentLoaded', function() {
    // Check if notifications were previously enabled
    chrome.storage.local.get(['notifications_enabled', 'atlassian_token'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        return;
      }
      
      const notificationsEnabled = result.notifications_enabled === 'true';
      const savedToken = result.atlassian_token || '';
      
      // Set checkbox state based on saved preferences
      document.getElementById('enable-notifications').checked = notificationsEnabled;
      
      // Set saved token if it exists
      if (notificationsEnabled && savedToken) {
        document.getElementById('token-input').value = savedToken;
      }
      
      // Apply initial states
      toggleElements();
      
      // Load domains info
      chrome.storage.local.get('jira_domains', function(result) {
        if (result.jira_domains && result.jira_domains.length > 0) {
          const domains = result.jira_domains;
          console.log('Detected Jira domains:', domains);
        }
      });
    });
    
    // Add event listeners for all interactive elements
    document.getElementById('enable-notifications').addEventListener('change', toggleElements);
    document.getElementById('token-btn').addEventListener('click', showTokenModal);
    document.getElementById('save-btn').addEventListener('click', saveSettings);
    document.getElementById('test-btn').addEventListener('click', testNotifications);
    document.getElementById('debug-btn').addEventListener('click', debugConnection);
    document.getElementById('close-modal-btn').addEventListener('click', closeTokenModal);
    
    // Add email test button
    const buttonsContainer = document.querySelector('.buttons');
    const emailTestButton = document.createElement('button');
    emailTestButton.className = 'btn btn-secondary';
    emailTestButton.id = 'email-test-btn';
    emailTestButton.textContent = 'Test Email';
    emailTestButton.addEventListener('click', testEmailSending);
    emailTestButton.style.backgroundColor = '#00B8D9';
    emailTestButton.style.color = 'white';
    emailTestButton.style.border = 'none';
    
    // Add it to buttons container
    buttonsContainer.insertBefore(emailTestButton, document.getElementById('save-btn'));
    
    // Make sure it respects the enabled/disabled state
    emailTestButton.disabled = !document.getElementById('enable-notifications').checked;
    if (emailTestButton.disabled) {
      emailTestButton.classList.add('disabled');
      emailTestButton.style.opacity = '0.5';
      emailTestButton.style.cursor = 'not-allowed';
    }
    
    // Display success message
    console.log('Bulle de chat affichée avec succès');
  });