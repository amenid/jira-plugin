// Simple build script to concatenate content script files
const fs = require('fs');
const path = require('path');

// Define the order of files to concatenate
const files = [
  'constants.js',
  'domHelpers.js',
  'errorBubble.js',
  'fieldValidation.js',
  'errorHandling.js',
  'chatBubble.js',
  'summaryAutocomplete.js',
  'index.js'
];

// Function to read file content
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// Function to convert import/export statements to regular code
function removeModuleStatements(content) {
  // Remove import statements
  content = content.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
  
  // Remove export statements but keep the function/variable declarations
  content = content.replace(/export\s+function/g, 'function');
  content = content.replace(/export\s+const/g, 'const');
  content = content.replace(/export\s+let/g, 'let');
  content = content.replace(/export\s+class/g, 'class');
  content = content.replace(/export\s+default/g, '');
  
  return content;
}

// Main build function
function buildContentScript() {
  console.log('Building content.js...');
  
  let combinedContent = `// Combined content.js - Generated on ${new Date().toLocaleString()}\n\n`;
  
  // Add each file's content
  files.forEach(file => {
    const filePath = path.join(__dirname, 'src', 'contentScripts', file);
    let content = readFileContent(filePath);
    
    // Remove import/export statements
    content = removeModuleStatements(content);
    
    // Add file header comment
    combinedContent += `// =============================================\n`;
    combinedContent += `// ${file}\n`;
    combinedContent += `// =============================================\n\n`;
    combinedContent += content;
    combinedContent += '\n\n';
  });
  
  // Write the combined file
  fs.writeFileSync(path.join(__dirname, 'content.js'), combinedContent);
  console.log('Built content.js successfully!');
}

// Run the build
buildContentScript();