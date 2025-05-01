// service-worker.js (Manifest V3 - Version Finale)
'use strict';

let errorCount = 0;
const CHATBOT_URL = 'https://votre-chatbot.streamlit.app';

// Gestion du badge avec sécurité
function updateBadge(count) {
  errorCount = Math.max(0, parseInt(count) || 0); 
  const badgeText = errorCount > 0 ? String(errorCount) : "";
  const badgeColor = errorCount > 0 ? [255, 0, 0, 255] : [0, 128, 0, 255];

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}
// Vérification des URLs autorisées
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('atlassian.net') || 
           parsed.hostname === 'votre-chatbot.streamlit.app';
  } catch {
    return false;
  }
}


// Injection sécurisée du chatbot
async function injectChatbot(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isAllowedUrl(tab.url)) {
      console.warn('URL non autorisée pour injection:', tab.url);
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (url, styles) => {
        const existingFrame = document.getElementById('chatbot-frame');
        if (existingFrame) {
          existingFrame.style.display = existingFrame.style.display === 'none' ? 'block' : 'none';
          return;
        }

        const iframe = document.createElement('iframe');
        iframe.id = 'chatbot-frame';
        iframe.src = url;
        Object.assign(iframe.style, styles);
        document.body.appendChild(iframe);
      },
      args: [
        CHATBOT_URL,
        {
          position: 'fixed',
          top: '50px',
          right: '10px',
          width: '400px',
          height: '500px',
          border: '1px solid #ccc',
          zIndex: '1000',
          backgroundColor: 'white'
        }
      ]
    });
  } catch (error) {
    console.error('Échec injection chatbot:', error);
  }
}

// Gestion des messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return;

  switch (message.type) {
    case 'updateErrors':
      updateBadge(message.count);
      break;

    case 'toggleChatbot':
      injectChatbot(sender.tab.id);
      break;
  }
});

// Gestion du clic sur l'icône
chrome.action.onClicked.addListener(async (tab) => {
    try {
      // Injecter le content.js SI nécessaire
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
  
      // Envoyer le message APRÈS l'injection
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: "showBubble",
        errorCount: 5 // Exemple de données
      });
      
      console.log("Réponse du content.js:", response);
    } catch (error) {
      console.error("Échec de communication :", error);
    }
  });
// Initialisation
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'BUGS REPORT JIRA' });
  console.log('Extension initialisée');
});

// Gestion des erreurs globales
self.addEventListener('error', (event) => {
  console.error('Erreur SW:', event.error);
});





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateErrors") {
    // Mettre à jour le badge avec le nombre d'erreurs
    if (message.count > 0) {
      // Afficher le nombre d'erreurs sur l'icône
      chrome.action.setBadgeText({ text: message.count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // Rouge
    } else {
      // Effacer le badge si pas d'erreurs
      chrome.action.setBadgeText({ text: "" });
    }
    sendResponse({ success: true });
    return true;
  }
});
// Configuration
// Configuration
const CHECK_INTERVAL_MINUTES = 1; // Vérification toutes les 1 minutes
const BREVO_API_KEY = "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"; // Votre clé API Brevo
const SENDER_EMAIL = "7d7544006@smtp-brevo.com"; // Votre identifiant SMTP Brevo
const SENDER_NAME = "Jira Notifications";
// Le RECIPIENT_EMAIL sera automatiquement récupéré depuis les informations du popup

// Store for tracking already notified items to prevent duplicates
let notifiedItems = {
  comments: new Set(),
  labels: new Set(),
  dueDates: new Set(),
  sprints: new Set()
};

// Automatically detect Jira domains the user is working with
let detectedDomains = new Set();

// Listen for tab updates to detect Jira domains
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Check if URL exists and it's a complete load
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if the URL contains atlassian.net or is a Jira server
    if (tab.url.includes('atlassian.net') || tab.url.includes('jira')) {
      try {
        const url = new URL(tab.url);
        // Store the domain if it looks like a Jira instance
        if (url.hostname.includes('atlassian.net') || 
            url.pathname.includes('jira') || 
            url.hostname.includes('jira')) {
          detectedDomains.add(url.hostname);
          // Save detected domains to storage
          chrome.storage.local.set({'jira_domains': Array.from(detectedDomains)});
          console.log('Detected Jira domain:', url.hostname);
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
    }
  }
});

// Helper function to create headers
function createAuthHeaders(token) {
  // If token is in email:token format
  if (token.includes(':')) {
    return {
      'Authorization': 'Basic ' + btoa(token),
      'Accept': 'application/json'
    };
  } 
  // If token is just an API token, we need to extract email from somewhere else
  // or use a default email
  else {
    // Use a placeholder email if none is provided
    const email = "your-email@example.com";
    return {
      'Authorization': 'Basic ' + btoa(`${email}:${token}`),
      'Accept': 'application/json'
    };
  }
}
async function initializeSecureCredentials() {
  const result = await chrome.storage.local.get(['brevo_api_key']);
  if (!result.brevo_api_key) {
    await chrome.storage.local.set({
      'brevo_api_key': BREVO_API_KEY,
      'sender_email': SENDER_EMAIL,
      'sender_name': SENDER_NAME
    });
    console.log('Brevo credentials initialized');
  }
}

// Call this at startup:
initializeSecureCredentials();

async function getBrevoApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['brevo_api_key'], function(result) {
      resolve(result.brevo_api_key);
    });
  });
}
// Fonction pour envoyer un email via Brevo
// Improved function for sending emails via Brevo
async function sendEmailViaBrevo(to, subject, htmlContent, textContent) {
  const BREVO_API_URL = "https://api.sendinblue.com/v3/smtp/email";
  
  try {
    // 1. Récupération de la clé API
    const apiKey = await getBrevoApiKey();
    if (!apiKey) {
      console.error('No Brevo API key configured');
      return { success: false, error: 'API key not configured' };
    }

    // 2. Validation des paramètres
    console.log(`Attempting to send email to ${to} via Brevo`);
    
    if (!to || !subject) {
      throw new Error("Missing required parameters: recipient email or subject");
    }
    
    if (!htmlContent && !textContent) {
      throw new Error("Email must have either HTML or text content");
    }

    // 3. Préparation de la requête
    const requestBody = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent || "",
      textContent: textContent || ""
    };

    // 4. Envoi de la requête
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    console.log('Request payload:', {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent?.substring(0, 100) + '...', // Log partiel
      textContent: textContent?.substring(0, 100) + '...'
    });
    // 5. Traitement de la réponse
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { rawResponse: await response.text() };
    }

    if (response.ok) {
      console.log('Email successfully sent via Brevo:', responseData);
      return { success: true, data: responseData };
    } else {
      console.error('Brevo API error status:', response.status);
      console.error('Brevo API error details:', responseData);
      return { 
        success: false, 
        status: response.status,
        error: responseData
      };
    }
    
  } catch (error) {
    console.error('Exception during Brevo API call:', error);
    return { 
      success: false, 
      error: {
        message: error.message,
        stack: error.stack
      } 
    };
  }
}

// Fonction pour créer un contenu d'email HTML
function createHTMLEmailContent(title, message, link, comment = null, issue = null) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #DFE1E6; border-radius: 3px;">
      <div style="background-color: #0052CC; color: white; padding: 15px; border-radius: 3px 3px 0 0;">
        <h2 style="margin: 0;">${title}</h2>
      </div>
      <div style="padding: 20px;">
        <p>${message}</p>
        
        ${comment ? `
        <div style="border-left: 4px solid #DFE1E6; padding-left: 15px; margin: 15px 0;">
          <p>${getTextFromComment(comment).replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 20px;">
          <a href="${link}" style="background-color: #0052CC; color: white; padding: 10px 15px; text-decoration: none; border-radius: 3px; display: inline-block;">Voir dans Jira</a>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #6B778C;">
          <p>Cette notification a été envoyée automatiquement par l'extension Jira Notification Manager.</p>
        </div>
      </div>
    </div>
  `;
}

// Fonction pour créer un contenu d'email simple (texte)
function createSimpleEmailContent(title, message, link, comment = null) {
  let content = `Notification Jira: ${title}\n\n`;
  content += `${message}\n\n`;
  
  if (comment) {
    content += `Commentaire:\n${getTextFromComment(comment)}\n\n`;
  }
  
  content += `Voir dans Jira: ${link}\n\n`;
  content += `Cette notification a été envoyée automatiquement par l'extension Jira Notification Manager.`;
  
  return content;
}

// Function to send email notification
// Function to send email notification with improved error handling
function sendEmailNotification(title, message, link, comment = null, issue = null) {
  // Récupérer l'email du destinataire depuis le stockage
  chrome.storage.local.get(['user_email'], function(result) {
    const userEmail = result.user_email || '';
    
    if (!userEmail) {
      console.log('Aucun email utilisateur trouvé. Impossible d\'envoyer une notification par email.');
      return;
    }
    
    console.log(`Préparation de l'envoi d'email à ${userEmail} via Brevo`);
    
    // Créer les contenus de l'email
    let textContent = createSimpleEmailContent(title, message, link, comment);
    let htmlContent = createHTMLEmailContent(title, message, link, comment, issue);
    
    // Envoyer l'email via Brevo
    sendEmailViaBrevo(
      userEmail,
      `[Jira] ${title}`,
      htmlContent,
      textContent
    ).then(result => {
      if (result.success) {
        console.log('Email envoyé avec succès à', userEmail);
      } else {
        console.error('Échec de l\'envoi d\'email:', JSON.stringify(result.error));
        // Log specific error messages if available
        if (result.error && result.error.message) {
          console.error('Message d\'erreur:', result.error.message);
        }
        if (result.status) {
          console.error('Code d\'état HTTP:', result.status);
        }
      }
    }).catch(err => {
      console.error('Exception lors de l\'envoi d\'email:', err);
    });
  });
}

// Monitor Jira events based on settings
async function monitorJiraEvents() {
  try {
    // Get settings from chrome.storage
    const result = await chrome.storage.local.get(['notifications_enabled', 'atlassian_token', 'jira_domains']);
    const notificationsEnabled = result.notifications_enabled === 'true';
    const token = result.atlassian_token;
    
    if (!notificationsEnabled || !token) {
      console.log('Notifications disabled or token not found');
      return;
    }
    
    // Get all detected domains
    let domains = result.jira_domains || [];
    
    if (domains.length === 0) {
      console.log('No Jira domains detected. Please visit your Jira instance.');
      return;
    }
    
    console.log(`Found ${domains.length} Jira domains to check:`, domains);
    
    // Monitor each detected domain
    for (const domain of domains) {
      console.log(`Checking Jira events for domain: ${domain}`);
      
      // First test if we can access this domain with the provided token
      try {
        const testResponse = await fetch(`https://${domain}/rest/api/2/myself`, {
          method: 'GET',
          headers: createAuthHeaders(token)
        });
        
        if (!testResponse.ok) {
          console.log(`Authentication failed for ${domain}. Status: ${testResponse.status}`);
          console.log('Make sure your token is in the format "email:api-token" or that you have provided a valid API token');
          continue; // Skip to next domain
        }
        
        const userData = await testResponse.json();
        console.log(`Successfully authenticated as ${userData.displayName || userData.name || 'user'} on ${domain}`);
        
        // If authentication is successful, proceed with checking events
        await checkForNewComments(token, domain);
        await checkForSpecificLabels(token, domain);
        await checkForApproachingDueDates(token, domain);
        await checkForSprintsAboutToFinish(token, domain);
        
      } catch (error) {
        console.error(`Error connecting to ${domain}:`, error);
      }
    }
    
    console.log('Completed Jira event monitoring cycle');
    
  } catch (error) {
    console.error('Error in monitorJiraEvents:', error);
  }
}

// Check for new comments
async function checkForNewComments(token, domain) {
  try {
    console.log(`Checking for new comments on ${domain}...`);
    
    // Test if domain is accessible and is a valid Jira instance
    console.log(`Testing authentication on ${domain}...`);
    const testResponse = await fetch(`https://${domain}/rest/api/2/myself`, {
      method: 'GET',
      headers: createAuthHeaders(token)
    });
    
    if (!testResponse.ok) {
      console.error(`Domain ${domain} authentication failed. Status: ${testResponse.status}`);
      try {
        const errorText = await testResponse.text();
        console.error('Authentication error details:', errorText);
      } catch (e) {
        console.error('Could not read error details');
      }
      return;
    }
    
    const userData = await testResponse.json();
    console.log(`Successfully authenticated as ${userData.displayName || userData.name || userData.key || 'user'}`);
    
    // Try different JQL queries with increasing simplicity until one works
    const jqlQueries = [
      "updated >= -1d AND comment ~ \"*\""  ,// Cherche les commentaires non vides
      "updated >= -1d"                           // Fallback
    ];
    
    let response = null;
    let successfulJql = null;
    
    // Try each JQL query until one works
    for (const jql of jqlQueries) {
      try {
        console.log(`Trying JQL query: "${jql}"`);
        const searchUrl = jql ? 
          `https://${domain}/rest/api/2/search?jql=${encodeURIComponent(jql)}` : 
          `https://${domain}/rest/api/2/search`;
          
        console.log(`Making request to: ${searchUrl}`);
        
        response = await fetch(searchUrl, {
          method: 'GET',
          headers: createAuthHeaders(token)
        });
        
        if (response.ok) {
          console.log(`JQL query successful: "${jql}"`);
          successfulJql = jql;
          break;
        } else {
          console.log(`JQL query failed with status ${response.status}: "${jql}"`);
          try {
            const errorText = await response.text();
            console.log('Error details:', errorText);
          } catch (e) {
            console.log('Could not read error details');
          }
        }
      } catch (err) {
        console.error(`Error with JQL query "${jql}":`, err);
      }
    }
    
    if (!response || !response.ok) {
      console.error(`All JQL queries failed. Cannot search for commented issues.`);
      return;
    }
    
    // Process the successful response
    const data = await response.json();
    console.log(`Query returned ${data.total} issues (showing ${data.issues?.length || 0})`);
    
    if (!data.issues || data.issues.length === 0) {
      console.log('No issues found matching the query');
      return;
    }
    
    // For each issue, check for recent comments
    let commentCount = 0;
    let notificationCount = 0;
    
    for (const issue of data.issues) {
      console.log(`Checking comments for issue ${issue.key}...`);
      
      // Attempt to get comments in different ways based on Jira version
      const commentApis = [
        `https://${domain}/rest/api/2/issue/${issue.key}/comment`,
        `https://${domain}/rest/api/latest/issue/${issue.key}/comment`
      ];
      
      let commentsData = null;
      
      for (const commentApi of commentApis) {
        try {
          console.log(`Fetching comments from: ${commentApi}`);
          const commentsResponse = await fetch(commentApi, {
            method: 'GET',
            headers: createAuthHeaders(token)
          });
          
          if (commentsResponse.ok) {
            commentsData = await commentsResponse.json();
            console.log(`Successfully retrieved ${commentsData.comments?.length || 0} comments for ${issue.key}`);
            break;
          } else {
            console.log(`Failed to get comments from ${commentApi}. Status: ${commentsResponse.status}`);
          }
        } catch (err) {
          console.error(`Error fetching comments from ${commentApi}:`, err);
        }
      }
      
      if (!commentsData || !commentsData.comments || commentsData.comments.length === 0) {
        console.log(`No comments found for issue ${issue.key}`);
        continue;
      }
      
      // Check for recent comments (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentComments = commentsData.comments.filter(comment => {
        try {
          const commentDate = new Date(comment.updated || comment.created);
          return commentDate > yesterday;
        } catch (e) {
          console.error(`Error parsing date for comment in ${issue.key}:`, e);
          return false;
        }
      });
      
      commentCount += recentComments.length;
      console.log(`Found ${recentComments.length} recent comments for issue ${issue.key}`);
      
      for (const comment of recentComments) {
        try {
          const commentId = `${domain}-${comment.id}`;
          
          // Check if we've already notified about this comment
          if (!notifiedItems.comments.has(commentId)) {
            console.log(`Sending notification for new comment on ${issue.key} by ${comment.author.displayName || comment.author.name || 'unknown'}`);
            
            const commentText = getTextFromComment(comment);
            console.log(`Comment text: ${commentText.substring(0, 50)}...`);
            
            // Send browser notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: `New Comment on ${issue.key}`,
              message: `${comment.author.displayName || comment.author.name || 'Someone'} commented: ${commentText.substring(0, 100)}...`,
              contextMessage: domain,
              priority: 2
            }, function(notificationId) {
              // Store the link to be opened when the notification is clicked
              chrome.storage.local.set({ 
                [notificationId]: `https://${domain}/browse/${issue.key}` 
              });
              console.log(`Notification created with ID: ${notificationId}`);
            });
            
            // Send email notification
            sendEmailNotification(
              `New Comment on ${issue.key}`,
              `${comment.author.displayName || comment.author.name || 'Someone'} commented on ${issue.key}`,
              `https://${domain}/browse/${issue.key}`,
              comment,
              issue
            );
            
            // Mark as notified
            notifiedItems.comments.add(commentId);
            notificationCount++;
          } else {
            console.log(`Already notified about comment ${comment.id} on ${issue.key}`);
          }
        } catch (commentError) {
          console.error(`Error processing comment in ${issue.key}:`, commentError);
        }
      }
    }
    
    console.log(`Comment checking complete. Found ${commentCount} recent comments, sent ${notificationCount} notifications.`);
    
  } catch (error) {
    console.error(`Error checking for new comments on ${domain}:`, error);
  }
}

// Helper function to extract text from comment (handling different formats)
function getTextFromComment(comment) {
  // Handle different Jira comment formats
  if (typeof comment.body === 'string') {
    return comment.body;
  } else if (comment.body && comment.body.content) {
    // Try to extract text from Jira's Atlassian Document Format
    try {
      let text = '';
      const traverse = (content) => {
        if (!content) return;
        if (Array.isArray(content)) {
          content.forEach(item => traverse(item));
        } else if (content.text) {
          text += content.text + ' ';
        } else if (content.content) {
          traverse(content.content);
        }
      };
      
      traverse(comment.body.content);
      return text.trim();
    } catch (e) {
      return "Unable to extract comment text";
    }
  }
  return "Comment text unavailable";
}

// Check for specific labels (customize to your needs)
async function checkForSpecificLabels(token, domain) {
  const labelsToMonitor = ['urgent', 'high-priority', 'critical']; // Add your specific labels
  
  try {
    const jql = encodeURIComponent(`labels in (${labelsToMonitor.join(',')}) AND updatedDate > -24h`);
    const response = await fetch(`https://${domain}/rest/api/2/search?jql=${jql}`, {
      method: 'GET',
      headers: createAuthHeaders(token)
    });
    
    if (!response.ok) {
      console.log(`Failed to search for labeled issues. Status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    if (!data.issues || data.issues.length === 0) {
      console.log('No issues with important labels found in the last 24 hours');
      return;
    }
    
    console.log(`Found ${data.issues.length} issues with important labels in the last 24 hours`);
    
    for (const issue of data.issues) {
      const issueId = issue.id;
      const issueLabels = issue.fields.labels || [];
      
      // Find which monitored labels are on this issue
      const matchedLabels = issueLabels.filter(label => labelsToMonitor.includes(label));
      
      if (matchedLabels.length > 0) {
        const notificationKey = `${domain}-${issueId}-${matchedLabels.join('-')}`;
        
        // Check if we've already notified about these labels on this issue
        if (!notifiedItems.labels.has(notificationKey)) {
          console.log(`Sending notification for important labels on ${issue.key}: ${matchedLabels.join(', ')}`);
          
          // Send browser notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: `Important Label on ${issue.key}`,
            message: `The following important labels were detected: ${matchedLabels.join(', ')}`,
            contextMessage: domain,
            priority: 2
          }, function(notificationId) {
            // Store the link to be opened when the notification is clicked
            chrome.storage.local.set({ 
              [notificationId]: `https://${domain}/browse/${issue.key}` 
            });
          });
          
          // Send email notification
          sendEmailNotification(
            `Important Label on ${issue.key}`,
            `The following important labels were detected: ${matchedLabels.join(', ')}`,
            `https://${domain}/browse/${issue.key}`,
            null,
            issue
          );
          
          // Mark as notified
          notifiedItems.labels.add(notificationKey);
        }
      }
    }
  } catch (error) {
    console.error(`Error checking for specific labels on ${domain}:`, error);
  }
}

// Check for approaching due dates (within next 2 days)
async function checkForApproachingDueDates(token, domain) {
  try {
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    
    const jql = encodeURIComponent(`duedate >= "${formatDate(today)}" AND duedate <= "${formatDate(twoDaysFromNow)}" AND status != Done`);
    
    const response = await fetch(`https://${domain}/rest/api/2/search?jql=${jql}`, {
      method: 'GET',
      headers: createAuthHeaders(token)
    });
    
    if (!response.ok) {
      console.log(`Failed to search for issues with approaching due dates. Status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    if (!data.issues || data.issues.length === 0) {
      console.log('No issues with approaching due dates found');
      return;
    }
    
    console.log(`Found ${data.issues.length} issues with approaching due dates`);
    
    for (const issue of data.issues) {
      const dueDate = issue.fields.duedate;
      const notificationKey = `${domain}-${issue.id}-duedate-${dueDate}`;
      
      // Check if we've already notified about this due date
      if (!notifiedItems.dueDates.has(notificationKey)) {
        console.log(`Sending notification for approaching due date on ${issue.key}: ${dueDate}`);
        
        // Send browser notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: `Due Date Approaching for ${issue.key}`,
          message: `This issue is due on ${formatDateForDisplay(dueDate)}`,
          contextMessage: domain,
          priority: 2
        }, function(notificationId) {
          // Store the link to be opened when the notification is clicked
          chrome.storage.local.set({ 
            [notificationId]: `https://${domain}/browse/${issue.key}` 
          });
        });
        
        // Send email notification
        sendEmailNotification(
          `Due Date Approaching for ${issue.key}`,
          `This issue is due on ${formatDateForDisplay(dueDate)}`,
          `https://${domain}/browse/${issue.key}`,
          null,
          issue
        );
        
        // Mark as notified
        notifiedItems.dueDates.add(notificationKey);
      }
    }
  } catch (error) {
    console.error(`Error checking for approaching due dates on ${domain}:`, error);
  }
}

// Check for sprints about to finish with open tickets (within next 2 days)
async function checkForSprintsAboutToFinish(token, domain) {
  try {
    // Try different API endpoints for different Jira versions
    let apiPaths = [
      { base: 'rest/agile/1.0', boardPath: '/board?type=scrum' },
      { base: 'rest/greenhopper/1.0', boardPath: '/rapidviews/list' },
      { base: 'rest/agile/latest', boardPath: '/board?type=scrum' }
    ];
    
    let boards = [];
    let successfulApiPath = null;
    
    // Try each API path until we find one that works
    for (const apiPath of apiPaths) {
      try {
        const response = await fetch(`https://${domain}/${apiPath.base}${apiPath.boardPath}`, {
          method: 'GET',
          headers: createAuthHeaders(token)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Different APIs return boards in different formats
          if (data.values && Array.isArray(data.values)) {
            boards = data.values;
            successfulApiPath = apiPath;
            console.log(`Found ${boards.length} boards using ${apiPath.base}`);
            break;
          } else if (data.views && Array.isArray(data.views)) {
            boards = data.views;
            successfulApiPath = apiPath;
            console.log(`Found ${boards.length} boards using ${apiPath.base}`);
            break;
          }
        } else {
          console.log(`API ${apiPath.base} returned status ${response.status}`);
        }
      } catch (e) {
        console.log(`Error trying API ${apiPath.base}:`, e.message);
        // Continue to next API path
      }
    }
    
    if (!successfulApiPath || boards.length === 0) {
      console.log(`No scrum boards found on ${domain} or API access denied`);
      return;
    }
    
    // Process each board to find active sprints
    for (const board of boards) {
      const boardId = board.id;
      
      // Get sprints for this board
      let sprints = [];
      
      if (successfulApiPath.base === 'rest/greenhopper/1.0') {
        // Jira Server format
        try {
          const sprintsResponse = await fetch(`https://${domain}/${successfulApiPath.base}/sprintquery/${boardId}?includeHistoricSprints=false&includeFutureSprints=false`, {
            method: 'GET',
            headers: createAuthHeaders(token)
          });
          
          if (sprintsResponse.ok) {
            const sprintsData = await sprintsResponse.json();
            sprints = sprintsData.sprints || [];
          } else {
            console.log(`Failed to get sprints for board ${boardId}. Status: ${sprintsResponse.status}`);
            continue;
          }
        } catch (e) {
          console.error(`Error getting sprints for board ${boardId}:`, e);
          continue;
        }
      } else {
        // Jira Cloud format
        try {
          const sprintsResponse = await fetch(`https://${domain}/${successfulApiPath.base}/board/${boardId}/sprint?state=active`, {
            method: 'GET',
            headers: createAuthHeaders(token)
          });
          
          if (sprintsResponse.ok) {
            const sprintsData = await sprintsResponse.json();
            sprints = sprintsData.values || [];
          } else {
            console.log(`Failed to get sprints for board ${boardId}. Status: ${sprintsResponse.status}`);
            continue;
          }
        } catch (e) {
          console.error(`Error getting sprints for board ${boardId}:`, e);
          continue;
        }
      }
      
      console.log(`Found ${sprints.length} active sprints for board ${boardId}`);
      
      // Check each sprint
      for (const sprint of sprints) {
        // Verify this sprint has an end date
        if (!sprint.endDate) {
          console.log(`Sprint ${sprint.name || sprint.id} has no end date`);
          continue;
        }
        
        // Check if sprint is ending within 2 days
        const endDate = new Date(sprint.endDate);
        const today = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(today.getDate() + 2);
        
        if (endDate >= today && endDate <= twoDaysFromNow) {
          console.log(`Sprint ${sprint.name || sprint.id} is ending soon`);
          
          // Find open issues in this sprint
          const jql = encodeURIComponent(`sprint = ${sprint.id} AND status != Done`);
          
          const issuesResponse = await fetch(`https://${domain}/rest/api/2/search?jql=${jql}`, {
            method: 'GET',
            headers: createAuthHeaders(token)
          });
          
          if (!issuesResponse.ok) {
            console.log(`Failed to get open issues for sprint ${sprint.id}. Status: ${issuesResponse.status}`);
            continue;
          }
          
          const issuesData = await issuesResponse.json();
          
          if (!issuesData.issues || issuesData.issues.length === 0) {
            console.log(`No open issues found for sprint ${sprint.name || sprint.id}`);
            continue;
          }
          
          console.log(`Found ${issuesData.issues.length} open issues in sprint ${sprint.name || sprint.id}`);
          
          const notificationKey = `${domain}-sprint-${sprint.id}-ending`;
          
          // Check if we've already notified about this sprint ending
          if (!notifiedItems.sprints.has(notificationKey)) {
            const sprintName = sprint.name || `Sprint ${sprint.id}`;
            
            // Send browser notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Sprint Ending Soon',
              message: `${sprintName} is ending on ${formatDateForDisplay(sprint.endDate)} with ${issuesData.issues.length} open tickets`,
              contextMessage: domain,
              priority: 2
            }, function(notificationId) {
              // Store the link to be opened when the notification is clicked
              let url;
              if (successfulApiPath.base.includes('greenhopper')) {
                // Jira Server format
                url = `https://${domain}/secure/RapidBoard.jspa?rapidView=${boardId}&view=reporting&chart=sprintRetrospective&sprint=${sprint.id}`;
              } else {
                // Jira Cloud format
                url = `https://${domain}/jira/software/projects/board/${boardId}/reports/sprint/${sprint.id}`;
              }
              
              chrome.storage.local.set({ [notificationId]: url });
            });
            
            // Send email notification
            sendEmailNotification(
              'Sprint Ending Soon',
              `${sprintName} is ending on ${formatDateForDisplay(sprint.endDate)} with ${issuesData.issues.length} open tickets`,
              `https://${domain}/secure/RapidBoard.jspa?rapidView=${boardId}&view=reporting&chart=sprintRetrospective&sprint=${sprint.id}`,
              null,
              { sprint: sprint, openIssues: issuesData.issues.length }
            );
           // Mark as notified
           notifiedItems.sprints.add(notificationKey);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error checking for sprints about to finish on ${domain}:`, error);
  }
}

// Test Jira connection
async function testJiraConnection() {
  try {
    const result = await chrome.storage.local.get(['atlassian_token', 'jira_domains']);
    const token = result.atlassian_token;
    const domains = result.jira_domains || [];
    
    if (!token) {
      console.error('No token found. Please save your settings first.');
      return { success: false, message: 'No token found' };
    }
    
    if (domains.length === 0) {
      console.error('No Jira domains detected. Please visit your Jira instance first.');
      return { success: false, message: 'No domains detected' };
    }
    
    console.log('Testing connection with domains:', domains);
    
    const results = [];
    
    for (const domain of domains) {
      try {
        console.log(`Testing connection to ${domain}...`);
        
        // Test basic connection
        const basicResponse = await fetch(`https://${domain}/status`, {
          method: 'GET'
        });
        
        if (!basicResponse.ok) {
          console.log(`Domain ${domain} is not accessible. Status: ${basicResponse.status}`);
          results.push({ domain, accessible: false, message: `Not accessible (${basicResponse.status})` });
          continue;
        }
        
        // Test authentication
        const authResponse = await fetch(`https://${domain}/rest/api/2/myself`, {
          method: 'GET',
          headers: createAuthHeaders(token)
        });
        
        if (authResponse.ok) {
          const userData = await authResponse.json();
          console.log(`Successfully authenticated as ${userData.displayName || userData.name || 'user'} on ${domain}`);
          results.push({ 
            domain, 
            accessible: true, 
            authenticated: true, 
            user: userData.displayName || userData.name || 'user' 
          });
        } else {
          console.log(`Authentication failed for ${domain}. Status: ${authResponse.status}`);
          results.push({ 
            domain, 
            accessible: true, 
            authenticated: false, 
            message: `Authentication failed (${authResponse.status})` 
          });
        }
      } catch (error) {
        console.error(`Error testing connection to ${domain}:`, error);
        results.push({ domain, accessible: false, message: error.message });
      }
    }
    
    console.log('Connection test results:', results);
    return { success: true, results };
  } catch (error) {
    console.error('Error in testJiraConnection:', error);
    return { success: false, message: error.message };
  }
}

// Test Brevo email sending
async function testBrevoEmailSending() {
  try {
    console.log('Testing Brevo email sending...');
    
    // Get recipient email from settings or use the default
    const result = await chrome.storage.local.get(['user_email']);
    const userEmail = result.user_email || RECIPIENT_EMAIL;
    
    if (!userEmail) {
      console.error('No recipient email address found.');
      return { success: false, message: 'No recipient email address found' };
    }
    
    // Send a test email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #DFE1E6; border-radius: 3px;">
        <div style="background-color: #0052CC; color: white; padding: 15px; border-radius: 3px 3px 0 0;">
          <h2 style="margin: 0;">Test Email from Jira Notification Manager</h2>
        </div>
        <div style="padding: 20px;">
          <p>This is a test email to verify that Brevo email sending is working correctly.</p>
          <p>If you're receiving this email, your Jira notification system is properly configured.</p>
          
          <div style="margin-top: 20px;">
            <a href="https://www.atlassian.com/software/jira" style="background-color: #0052CC; color: white; padding: 10px 15px; text-decoration: none; border-radius: 3px; display: inline-block;">Visit Jira</a>
          </div>
          
          <div style="margin-top: 30px; font-size: 12px; color: #6B778C;">
            <p>This is a test notification sent at ${new Date().toLocaleString()}.</p>
          </div>
        </div>
      </div>
    `;
    
    const textContent = `Test Email from Jira Notification Manager
    
This is a test email to verify that Brevo email sending is working correctly.
If you're receiving this email, your Jira notification system is properly configured.

Visit Jira: https://www.atlassian.com/software/jira

This is a test notification sent at ${new Date().toLocaleString()}.`;
    
    const sendResult = await sendEmailViaBrevo(
      userEmail,
      'Test Email from Jira Notification Manager',
      htmlContent,
      textContent
    );
    
    if (sendResult.success) {
      console.log('Test email sent successfully to', userEmail);
      return { success: true, message: `Test email sent successfully to ${userEmail}` };
    } else {
      console.error('Failed to send test email:', sendResult.error);
      return { success: false, error: sendResult.error };
    }
  } catch (error) {
    console.error('Error testing Brevo email sending:', error);
    return { success: false, message: error.message };
  }
}

// Listen for notification clicks
chrome.notifications.onClicked.addListener(function(notificationId) {
  // Get the stored URL for this notification
  chrome.storage.local.get(notificationId, function(items) {
    if (items[notificationId]) {
      // Open the URL in a new tab
      chrome.tabs.create({ url: items[notificationId] });
      // Remove the stored URL
      chrome.storage.local.remove(notificationId);
    }
  });
});

// Helper function to format date for API requests
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to format date for display
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Start the monitoring
function startMonitoring() {
  console.log('Starting Jira monitoring service...');
  
  // Initialize Brevo configuration
  console.log('Identifiants Brevo initialisés en stockage sécurisé');
  
  // Load any previously detected domains
  chrome.storage.local.get('jira_domains', function(result) {
    if (result.jira_domains) {
      result.jira_domains.forEach(domain => detectedDomains.add(domain));
      console.log('Loaded previously detected domains:', [...detectedDomains]);
    }
  });
  
  // Run immediately on startup
  monitorJiraEvents();
  
  // Then schedule regular checks using chrome.alarms
  chrome.alarms.create('checkJiraEvents', { periodInMinutes: CHECK_INTERVAL_MINUTES });
}

// Listen for alarm
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'checkJiraEvents') {
    console.log('Alarm triggered: checking Jira events');
    monitorJiraEvents();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "testNotifications") {
    console.log("Testing notifications manually...");
    monitorJiraEvents().then(() => {
      sendResponse({status: "Testing notifications"});
    }).catch(error => {
      console.error("Error testing notifications:", error);
      sendResponse({status: "Error", message: error.message});
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === "testJiraConnection") {
    console.log("Testing Jira connection...");
    testJiraConnection().then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error("Error testing connection:", error);
      sendResponse({success: false, message: error.message});
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === "testEmailSending") {
    console.log("Testing email sending via Brevo...");
    testBrevoEmailSending().then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error("Error testing email sending:", error);
      sendResponse({success: false, message: error.message});
    });
    return true; // Keep the message channel open for async response
  }
});


// Log initialization
console.log('Extension initialisée');

// Start monitoring when service worker is activated
startMonitoring();